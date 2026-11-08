"""Turns per-cell inputs into mutually exclusive land-cover fractions (EQ-005).

Precedence per 1 m cell: water > building > tree > paved > other vegetation > bare.
  * water:      ESA WorldCover class 80. Water bodies larger than 5 ha (Manila Bay, lakes, rivers) are
                not "land" and are removed from the unit; smaller ponds count as water (cooling credit).
  * building:   OpenStreetMap building footprint (removes roofs the canopy model may mistake for trees).
  * tree:       canopy height >= threshold (2 m; 5 m tested as a variant).
  * paved:      OpenStreetMap paved areas, or WorldCover class 50 built-up.
  * other veg:  dry-season median NDVI >= cut (0.30; 0.25 / 0.35 tested as variants).
  * bare:       everything else (bare soil, sparse or dry vegetation).
Cells whose NDVI is unknown (too cloudy) are shared between other vegetation and bare in the proportion
seen in the cells that are known.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from scipy.ndimage import label

from .rasters import Grid
from .score import Fractions


@dataclass
class Layers:
    unit: np.ndarray  # bool, 1 m: cell inside the spatial unit
    chm: np.ndarray  # uint8 metres, 1 m (255 = no data)
    worldcover: np.ndarray  # uint8 classes, 10 m
    ndvi: np.ndarray  # float32, 10 m (NaN = unknown)
    building: np.ndarray  # bool, 1 m
    paved: np.ndarray  # bool, 1 m


def open_water_mask10(worldcover: np.ndarray, min_area_m2: float) -> np.ndarray:
    """10 m water cells that belong to a water body larger than `min_area_m2` (within the grid)."""
    water = worldcover == 80
    lab, n = label(water)
    if n == 0:
        return np.zeros_like(water)
    sizes = np.bincount(lab.ravel()) * 100.0  # m2 per 10 m cell
    big = sizes >= min_area_m2
    big[0] = False
    return big[lab]


def fractions(lay: Layers, canopy_m: int, ndvi_cut: float, open_water_m2: float) -> tuple[Fractions, dict]:
    up = Grid.up
    wc = up(lay.worldcover)
    ndvi = up(lay.ndvi)
    open_water = up(open_water_mask10(lay.worldcover, open_water_m2))

    land = lay.unit & ~open_water & (wc != 0)
    water = land & (wc == 80)
    building = land & ~water & lay.building
    tree = land & ~water & ~building & (lay.chm != 255) & (lay.chm >= canopy_m)
    paved = land & ~water & ~building & ~tree & (lay.paved | (wc == 50))
    rest = land & ~water & ~building & ~tree & ~paved
    known = rest & np.isfinite(ndvi)
    veg_known = known & (ndvi >= ndvi_cut)
    unknown = int((rest & ~np.isfinite(ndvi)).sum())

    n_land = int(land.sum())
    if n_land == 0:
        raise ValueError("unit has no land cells")
    n_known = int(known.sum())
    share_veg = (veg_known.sum() / n_known) if n_known else 0.0
    veg = veg_known.sum() + unknown * share_veg
    bare = (n_known - veg_known.sum()) + unknown * (1 - share_veg)
    pct = lambda n: 100.0 * float(n) / n_land  # noqa: E731
    f = Fractions(
        tree=pct(tree.sum()), other_veg=pct(veg), water=pct(water.sum()),
        sealed=pct(building.sum() + paved.sum()), bare=pct(bare),
    )
    diag = {
        "land_m2": n_land,
        "open_water_excluded_m2": int((lay.unit & open_water).sum()),
        "ndvi_unknown_share": (unknown / rest.sum()) if rest.sum() else 0.0,
        "building_m2": int(building.sum()),
        "chm_missing_share": float(((lay.chm == 255) & land).sum() / n_land),
    }
    return f, diag


def worldcover_cross_check(lay: Layers, open_water_m2: float) -> dict:
    """Tree and built-up shares from WorldCover alone (10 m), as an independent comparison."""
    wc = Grid.up(lay.worldcover)
    land = lay.unit & ~Grid.up(open_water_mask10(lay.worldcover, open_water_m2)) & (wc != 0)
    n = land.sum()
    return {
        "worldcover_tree_pct": round(100.0 * float((land & (wc == 10)).sum()) / n, 1) if n else None,
        "worldcover_builtup_pct": round(100.0 * float((land & (wc == 50)).sum()) / n, 1) if n else None,
    }
