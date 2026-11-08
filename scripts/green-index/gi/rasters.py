"""Raster inputs read onto a per-place grid: canopy height (1 m), ESA WorldCover (10 m), Sentinel-2 NDVI (10 m).

Each unit gets a 10 m grid in UTM 51N and a 1 m grid nested exactly inside it (10 x 10 cells per pixel),
so 10 m inputs can be upsampled with a plain repeat. Only small windows are read over HTTP from
cloud-optimised GeoTIFFs; nothing is downloaded whole.
"""
from __future__ import annotations

import json
import math
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass

import numpy as np
import planetary_computer
import rasterio
import requests
from pystac_client import Client
from rasterio.enums import Resampling
from rasterio.transform import from_origin
from rasterio.warp import reproject
from scipy.ndimage import binary_dilation
from shapely.geometry import shape

from . import config

GDAL_ENV = dict(
    AWS_NO_SIGN_REQUEST="YES",
    GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR",
    CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif,.TIF,.tiff",
    GDAL_HTTP_MAX_RETRY="4",
    GDAL_HTTP_RETRY_DELAY="2",
    VSI_CACHE="TRUE",
    GDAL_CACHEMAX=512,
)


@dataclass
class Grid:
    """A 10 m grid and the 1 m grid nested inside it, both in UTM 51N."""

    minx: float
    maxy: float
    w10: int
    h10: int

    @classmethod
    def around(cls, bounds: tuple[float, float, float, float], pad: float = 10.0) -> "Grid":
        minx, miny, maxx, maxy = bounds
        minx = math.floor((minx - pad) / 10) * 10
        miny = math.floor((miny - pad) / 10) * 10
        maxx = math.ceil((maxx + pad) / 10) * 10
        maxy = math.ceil((maxy + pad) / 10) * 10
        return cls(minx, maxy, int((maxx - minx) / 10), int((maxy - miny) / 10))

    @property
    def t10(self):
        return from_origin(self.minx, self.maxy, 10, 10)

    @property
    def t1(self):
        return from_origin(self.minx, self.maxy, 1, 1)

    @property
    def shape1(self) -> tuple[int, int]:
        return self.h10 * 10, self.w10 * 10

    @staticmethod
    def up(a10: np.ndarray) -> np.ndarray:
        """10 m -> 1 m by repetition (grids are nested exactly)."""
        return np.repeat(np.repeat(a10, 10, axis=0), 10, axis=1)


# ---------- Canopy height (Meta/WRI CHMv2, EPSG:3857, ~1.19 m, uint8 metres) ----------

def _quadkey(lon: float, lat: float, z: int = 10) -> str:
    n = 2**z
    x = int((lon + 180) / 360 * n)
    lat_r = math.radians(lat)
    y = int((1 - math.asinh(math.tan(lat_r)) / math.pi) / 2 * n)
    qk = ""
    for i in range(z, 0, -1):
        d, m = 0, 1 << (i - 1)
        d += 1 if x & m else 0
        d += 2 if y & m else 0
        qk += str(d)
    return qk


def chm_tiles(lonlat_bounds: tuple[float, float, float, float]) -> list[str]:
    w, s, e, n = lonlat_bounds
    return sorted({_quadkey(x, y) for x in (w, e) for y in (s, n)})


def read_chm(grid: Grid, tiles: list[str]) -> np.ndarray:
    """Canopy height (m) on the 1 m grid; 255 where no tile covers a cell."""
    out = np.full(grid.shape1, 255, dtype=np.uint8)
    with rasterio.Env(**GDAL_ENV):
        for t in tiles:
            with rasterio.open(f"{config.CHM_BASE}/chm/{t}.tif") as src:
                part = np.full(grid.shape1, 255, dtype=np.uint8)
                reproject(
                    rasterio.band(src, 1), part, src_nodata=None, dst_transform=grid.t1, dst_crs=config.UTM,
                    dst_nodata=255, resampling=Resampling.nearest,
                )
                fill = (out == 255) & (part != 255)
                out[fill] = part[fill]
    return out


def chm_dates(tiles: list[str], lonlat_geom) -> tuple[str | None, str | None]:
    """Earliest and latest imagery month behind the canopy map over this unit."""
    dates: list[str] = []
    for t in tiles:
        meta = requests.get(f"{config.CHM_BASE}/metadata/{t}.geojson", timeout=60).json()
        for f in meta.get("features", []):
            if shape(f["geometry"]).intersects(lonlat_geom):
                dates.append(str(f["properties"].get("acq_date"))[:7])
    return (min(dates), max(dates)) if dates else (None, None)


# ---------- ESA WorldCover 2021 v200 (Planetary Computer) ----------

_PC = "https://planetarycomputer.microsoft.com/api/stac/v1"


def stac() -> Client:
    return Client.open(_PC, modifier=planetary_computer.sign_inplace)


def read_worldcover(grid: Grid, lonlat_bounds) -> np.ndarray:
    """WorldCover class codes on the 10 m grid (10 tree, 50 built-up, 80 water, ...; 0 = no data)."""
    items = list(stac().search(collections=["esa-worldcover"], bbox=lonlat_bounds, query={"esa_worldcover:product_version": {"eq": "2.0.0"}}).items())
    if not items:
        items = [i for i in stac().search(collections=["esa-worldcover"], bbox=lonlat_bounds).items() if "2021" in str(i.datetime)]
    out = np.zeros((grid.h10, grid.w10), dtype=np.uint8)
    with rasterio.Env(**GDAL_ENV):
        for it in items:
            with rasterio.open(it.assets["map"].href) as src:
                part = np.zeros_like(out)
                reproject(rasterio.band(src, 1), part, dst_transform=grid.t10, dst_crs=config.UTM, dst_nodata=0, resampling=Resampling.mode)
                out[out == 0] = part[out == 0]
    return out


# ---------- Sentinel-2 L2A NDVI composite (Planetary Computer) ----------

def s2_items(period: tuple[str, str], bbox=config.NCR_BBOX) -> list:
    search = stac().search(
        collections=["sentinel-2-l2a"], bbox=bbox, datetime=f"{period[0]}/{period[1]}",
        query={"eo:cloud_cover": {"lt": config.S2_MAX_SCENE_CLOUD}},
    )
    return sorted(search.items(), key=lambda i: i.datetime)


def _offset(item) -> float:
    """Processing baseline 04.00+ (from 25 Jan 2022) adds a +1000 radiometric offset to L2A reflectance."""
    try:
        return 1000.0 if float(item.properties.get("s2:processing_baseline", "0")) >= 4.0 else 0.0
    except ValueError:
        return 0.0


def _scene_ndvi(item, grids: dict[str, Grid]) -> dict[str, np.ndarray]:
    """NDVI for one scene on every unit's 10 m grid (NaN where cloudy or outside the scene)."""
    off = _offset(item)
    res: dict[str, np.ndarray] = {}
    with rasterio.Env(**GDAL_ENV):
        srcs = {k: rasterio.open(item.assets[k].href) for k in ("B04", "B08", "SCL")}
        try:
            for key, g in grids.items():
                arrs = {}
                for k, src in srcs.items():
                    a = np.zeros((g.h10, g.w10), dtype=np.uint16)
                    reproject(rasterio.band(src, 1), a, dst_transform=g.t10, dst_crs=config.UTM, dst_nodata=0, resampling=Resampling.nearest)
                    arrs[k] = a
                scl = arrs["SCL"]
                if not scl.any():
                    continue
                cloudy = binary_dilation(np.isin(scl, config.S2_CLOUD_SCL), iterations=1)
                ok = np.isin(scl, config.S2_KEEP_SCL) & ~cloudy & (arrs["B04"] > 0) & (arrs["B08"] > 0)
                red = np.clip((arrs["B04"].astype(np.float32) - off) / 10000.0, 0, None)
                nir = np.clip((arrs["B08"].astype(np.float32) - off) / 10000.0, 0, None)
                with np.errstate(invalid="ignore", divide="ignore"):
                    ndvi = (nir - red) / (nir + red)
                ndvi[~ok | ~np.isfinite(ndvi)] = np.nan
                res[key] = ndvi
        finally:
            for s in srcs.values():
                s.close()
    return res


def ndvi_composites(items: list, grids: dict[str, Grid], workers: int = 6) -> dict[str, tuple[np.ndarray, np.ndarray, list[str]]]:
    """Per unit: (median NDVI, clear-observation count, ids of scenes that contributed) on the 10 m grid."""
    stacks: dict[str, list[np.ndarray]] = {k: [] for k in grids}
    used: dict[str, list[str]] = {k: [] for k in grids}
    with ThreadPoolExecutor(max_workers=workers) as pool:
        for item, scene in zip(items, pool.map(lambda it: _scene_ndvi(it, grids), items)):
            for key, ndvi in scene.items():
                if np.isfinite(ndvi).any():
                    stacks[key].append(ndvi)
                    used[key].append(item.id)
    out = {}
    for key, g in grids.items():
        if stacks[key]:
            cube = np.stack(stacks[key])
            count = np.isfinite(cube).sum(axis=0)
            with np.errstate(all="ignore"):
                med = np.nanmedian(cube, axis=0)
            med[count < config.MIN_CLEAR_OBS] = np.nan
        else:
            count = np.zeros((g.h10, g.w10), dtype=int)
            med = np.full((g.h10, g.w10), np.nan)
        out[key] = (med.astype(np.float32), count, used[key])
    return out


def load_json(path: str) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)
