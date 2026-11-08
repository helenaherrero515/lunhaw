"""Fixed choices for EQ-005. Changing any of these means bumping METHOD_VERSION."""
from __future__ import annotations

METHOD_VERSION = "EQ-005 v1"

UTM = "EPSG:32651"  # UTM zone 51N, metres; covers Metro Manila
NCR_BBOX = (120.90, 14.33, 121.14, 14.80)  # lon/lat

LIBRARY_RADIUS_M = 300.0  # WHO access rule and the "300" of 3-30-300
SMALL_PARK_M2 = 5_000.0  # 0.5 ha, WHO lower bound: smaller parks are flagged lower confidence
OPEN_WATER_M2 = 50_000.0  # water bodies larger than 5 ha (bay, lakes, rivers) are excluded from the land area

CANOPY_HEIGHT_M = 2  # base threshold; 5 m is tested as a sensitivity variant
CANOPY_VARIANTS_M = (2, 5)
NDVI_VEG_CUT = 0.30  # non-tree pixels at or above this are "other vegetation"
NDVI_VARIANTS = (0.25, 0.30, 0.35)

S2_MAX_SCENE_CLOUD = 60  # loose scene filter; pixels are masked individually with SCL
S2_KEEP_SCL = (4, 5, 6)  # vegetation, not vegetated, water
S2_CLOUD_SCL = (3, 8, 9, 10)  # cloud shadow, cloud medium/high probability, thin cirrus (dilated by 1 px)
MIN_CLEAR_OBS = 3

MC_DRAWS = 5000
MC_N_EFF = 50.0  # wide prior until a photo-check provides a real sample size

# Parks are scored on their own OpenStreetMap polygon. IDs are pinned (a plain name search for
# "Rizal Park" returns a Las Piñas neighbourhood) and each expected name is checked at run time.
PARK_OSM: dict[str, dict] = {
    "ae200000-0000-4000-8000-000000000001": {"name": "Rizal Park", "osm": [("way", 24159887)], "expect": "Rizal"},
    "ae200000-0000-4000-8000-000000000002": {"name": "Arroceros Forest Park", "osm": [("way", 30106291)], "expect": "Arroceros"},
    "ae200000-0000-4000-8000-000000000003": {"name": "Paco Park", "osm": [("way", 318924742)], "expect": "Paco"},
    "ae200000-0000-4000-8000-000000000004": {"name": "Quezon Memorial Circle", "osm": [("relation", 12322420)], "expect": "Quezon"},
    "ae200000-0000-4000-8000-000000000005": {
        "name": "Marikina River Park",
        "osm": [("way", 25175881), ("way", 30062454), ("way", 30062456)],
        "expect": "",
    },
    "ae200000-0000-4000-8000-000000000006": {"name": "Ayala Triangle Gardens", "osm": [("way", 777918857)], "expect": "Ayala"},
    "ae200000-0000-4000-8000-000000000007": {"name": "Washington SyCip Park", "osm": [("way", 22674219)], "expect": "SyCip"},
}

CHM_BASE = "https://dataforgood-fb-data.s3.amazonaws.com/forests/v2/global/dinov3_global_chm_v2_ml3"

DATASETS = {
    "canopy": {
        "id": "meta-wri-chm-v2",
        "name": "High Resolution Canopy Height Maps v2 (WRI and Meta)",
        "version": "dinov3_global_chm_v2_ml3",
        "resolution": "about 1.2 m",
        "licence": "CC BY 4.0",
        "credit": "Canopy height: Version 2 High Resolution Canopy Height Maps by WRI and Meta, from "
        "https://registry.opendata.aws/dataforgood-fb-forestsv2 (CC BY 4.0). Source imagery for CHM © 2016 Vantor.",
    },
    "vegetation": {
        "id": "sentinel-2-l2a",
        "name": "Copernicus Sentinel-2 Level-2A (Microsoft Planetary Computer)",
        "resolution": "10 m",
        "licence": "Copernicus free and open data policy",
        "credit": "Contains modified Copernicus Sentinel data {years}.",
    },
    "landcover": {
        "id": "esa-worldcover",
        "name": "ESA WorldCover 2021 v200",
        "version": "v200",
        "resolution": "10 m",
        "licence": "CC BY 4.0",
        "credit": "© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by "
        "ESA WorldCover consortium.",
    },
    "osm": {
        "id": "openstreetmap",
        "name": "OpenStreetMap (park boundaries, buildings, paved areas)",
        "licence": "ODbL 1.0",
        "credit": "© OpenStreetMap contributors.",
    },
}
