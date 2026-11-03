/**
 * OpenStreetMap (OSM) Pedestrian Walkway Filter for Metro Manila (NCR)
 * Ticket: B-M0-02
 *
 * Enforces Invariant INV-001 and NV-005:
 * - Boundaries restricted strictly to NCR: lat [14.3, 14.8], lng [120.9, 121.2]
 * - Allows pedestrian-accessible road & path classes (footway, pedestrian, path, sidewalk, steps, residential, tertiary, secondary)
 * - Strictly rejects motorways, expressways, trunks, elevated skyways, and pedestrian-banned segments.
 */

import * as fs from "node:fs";
import { pathToFileURL } from "node:url";
import * as path from "node:path";

export type Position = [number, number];

export interface GeoJsonGeometry {
  type: "LineString" | "MultiLineString" | "Point" | "Polygon";
  coordinates: Position | Position[] | Position[][];
}

export interface OsmFeatureProperties {
  id?: string | number;
  osm_id?: number;
  name?: string;
  highway: string;
  foot?: string;
  access?: string;
  surface?: string;
  lit?: string;
  toll?: string;
  bridge?: string;
  layer?: string | number;
  lgu_city?: string;
  shade_score?: number;
  [key: string]: unknown;
}

export interface OsmFeature {
  type: "Feature";
  id?: string | number;
  geometry: GeoJsonGeometry;
  properties: OsmFeatureProperties;
}

export interface OsmFeatureCollection {
  type: "FeatureCollection";
  features: OsmFeature[];
  properties?: Record<string, unknown>;
}

/**
 * Canonical bounding box for National Capital Region (NCR), Philippines
 */
export const NCR_BOUNDING_BOX = {
  minLat: 14.3,
  maxLat: 14.8,
  minLng: 120.9,
  maxLng: 121.2,
} as const;

/**
 * Permitted OSM highway tags for pedestrian navigation and shade modeling
 */
export const ALLOWED_PEDESTRIAN_HIGHWAYS: Record<string, true> = {
  footway: true,
  pedestrian: true,
  path: true,
  sidewalk: true,
  steps: true,
  residential: true,
  tertiary: true,
  secondary: true,
};

/**
 * Expressways, motorways, and heavy vehicular arteries strictly excluded from pedestrian network
 */
export const FORBIDDEN_HIGHWAYS: Record<string, true> = {
  motorway: true,
  motorway_link: true,
  trunk: true,
  trunk_link: true,
};

/**
 * Known expressway / tollway keywords in Metro Manila that must never be in pedestrian network
 */
export const EXPRESSWAY_NAME_PATTERNS: readonly RegExp[] = [
  /\bskyway\b/i,
  /\bnlex\b/i,
  /\bslex\b/i,
  /\bnaiax\b/i,
  /\bcavitex\b/i,
  /\bmcx\b/i,
  /\bexpressway\b/i,
  /\btollway\b/i,
];

/**
 * Validates whether a GeoJSON coordinate [longitude, latitude] falls within NCR
 */
export function isCoordinateInNcr(lng: number, lat: number): boolean {
  return (
    lat >= NCR_BOUNDING_BOX.minLat &&
    lat <= NCR_BOUNDING_BOX.maxLat &&
    lng >= NCR_BOUNDING_BOX.minLng &&
    lng <= NCR_BOUNDING_BOX.maxLng
  );
}

/**
 * Recursively inspects all coordinates in a geometry to assert they lie within NCR bounds
 */
export function isGeometryInNcr(geometry: GeoJsonGeometry): boolean {
  if (!geometry || !geometry.coordinates) return false;

  const validate = (coords: unknown): boolean => {
    if (!Array.isArray(coords)) return false;
    if (coords.length === 2 && typeof coords[0] === "number" && typeof coords[1] === "number") {
      return isCoordinateInNcr(coords[0], coords[1]);
    }
    return coords.every(validate);
  };

  return validate(geometry.coordinates);
}

/**
 * Determines whether an OSM feature's properties allow pedestrian movement and obey safety rules
 */
export function isPedestrianPermitted(properties: OsmFeatureProperties): boolean {
  if (!properties || !properties.highway) {
    return false;
  }

  const highway = properties.highway.toLowerCase().trim();

  // Strict exclusion of expressways and motorways
  if (FORBIDDEN_HIGHWAYS[highway]) {
    return false;
  }

  // Explicit pedestrian ban (e.g., foot=no, access=no)
  if (properties.foot === "no" || properties.access === "no") {
    return false;
  }

  // Toll roads are vehicular only
  if (properties.toll === "yes") {
    return false;
  }

  // Check road name for expressway/tollway signatures
  if (typeof properties.name === "string") {
    for (const pattern of EXPRESSWAY_NAME_PATTERNS) {
      if (pattern.test(properties.name)) {
        return false;
      }
    }
  }

  // Must be in the allowed highway classifications
  return Boolean(ALLOWED_PEDESTRIAN_HIGHWAYS[highway]);
}

/**
 * Filters a feature collection to retain only safe, valid NCR pedestrian segments
 */
export function filterNcrPedestrianNetwork(
  collection: OsmFeatureCollection
): OsmFeatureCollection {
  const filteredFeatures = collection.features.filter((feature) => {
    // 1. Must be in NCR bounding box
    if (!isGeometryInNcr(feature.geometry)) {
      return false;
    }

    // 2. Must be pedestrian-safe (no motorways, no skyways)
    if (!isPedestrianPermitted(feature.properties)) {
      return false;
    }

    return true;
  });

  return {
    type: "FeatureCollection",
    properties: {
      filtered_at: new Date().toISOString(),
      dataset_id: "DS-001",
      bounding_box: NCR_BOUNDING_BOX,
      total_features: filteredFeatures.length,
    },
    features: filteredFeatures,
  };
}

/**
 * Generates sample validated pedestrian network features representing key Metro Manila civic walkways
 */
export function generateSampleNcrWalkways(): OsmFeatureCollection {
  const sampleFeatures: OsmFeature[] = [
    {
      type: "Feature",
      id: "osm-way-1001",
      properties: {
        osm_id: 1001,
        name: "UP Diliman Academic Oval Footway",
        highway: "pedestrian",
        foot: "yes",
        surface: "asphalt",
        lit: "yes",
        shade_score: 85,
        lgu_city: "Quezon City",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [121.0652, 14.6538],
          [121.0689, 14.6542],
          [121.0715, 14.6515],
          [121.0692, 14.6489],
          [121.0652, 14.6538],
        ],
      },
    },
    {
      type: "Feature",
      id: "osm-way-1002",
      properties: {
        osm_id: 1002,
        name: "Ayala Triangle Gardens Perimeter Promenade",
        highway: "footway",
        foot: "yes",
        surface: "paved",
        lit: "yes",
        shade_score: 92,
        lgu_city: "Makati",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [121.0221, 14.5574],
          [121.0245, 14.5582],
          [121.0251, 14.5558],
          [121.0227, 14.5551],
        ],
      },
    },
    {
      type: "Feature",
      id: "osm-way-1003",
      properties: {
        osm_id: 1003,
        name: "Intramuros General Luna Pedestrian Promenade",
        highway: "pedestrian",
        foot: "yes",
        surface: "cobblestone",
        lit: "yes",
        shade_score: 65,
        lgu_city: "Manila",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9741, 14.5896],
          [120.9768, 14.5872],
          [120.9795, 14.5851],
        ],
      },
    },
    {
      type: "Feature",
      id: "osm-way-1004",
      properties: {
        osm_id: 1004,
        name: "Rizal Park Luneta Central Promenade",
        highway: "footway",
        foot: "yes",
        surface: "paved",
        lit: "yes",
        shade_score: 78,
        lgu_city: "Manila",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9765, 14.5828],
          [120.9812, 14.5835],
          [120.9845, 14.5841],
        ],
      },
    },
    {
      type: "Feature",
      id: "osm-way-1005",
      properties: {
        osm_id: 1005,
        name: "Marikina River Park Promenade",
        highway: "path",
        foot: "yes",
        surface: "concrete",
        lit: "yes",
        shade_score: 74,
        lgu_city: "Marikina",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [121.0965, 14.6341],
          [121.0978, 14.6382],
          [121.0984, 14.6415],
        ],
      },
    },
    {
      type: "Feature",
      id: "osm-way-1006",
      properties: {
        osm_id: 1006,
        name: "Bonifacio High Street Walkway",
        highway: "pedestrian",
        foot: "yes",
        surface: "tiles",
        lit: "yes",
        shade_score: 82,
        lgu_city: "Taguig",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [121.0501, 14.5512],
          [121.0528, 14.5519],
          [121.0556, 14.5526],
        ],
      },
    },
    {
      type: "Feature",
      id: "osm-way-1007",
      properties: {
        osm_id: 1007,
        name: "Quezon Memorial Circle Jogging & Walking Path",
        highway: "footway",
        foot: "yes",
        surface: "asphalt",
        lit: "yes",
        shade_score: 88,
        lgu_city: "Quezon City",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [121.0485, 14.6512],
          [121.0515, 14.6532],
          [121.0525, 14.6515],
          [121.0498, 14.6495],
        ],
      },
    },
    {
      type: "Feature",
      id: "osm-way-1008",
      properties: {
        osm_id: 1008,
        name: "Katipunan Avenue West Sidewalk",
        highway: "sidewalk",
        foot: "yes",
        surface: "paved",
        lit: "yes",
        shade_score: 60,
        lgu_city: "Quezon City",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [121.0742, 14.6412],
          [121.0748, 14.6445],
          [121.0753, 14.6478],
        ],
      },
    },
    {
      type: "Feature",
      id: "osm-way-1009",
      properties: {
        osm_id: 1009,
        name: "Pinaglabanan Shrine Memorial Steps",
        highway: "steps",
        foot: "yes",
        surface: "concrete",
        lit: "yes",
        shade_score: 70,
        lgu_city: "San Juan",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [121.0315, 14.6042],
          [121.0318, 14.6046],
        ],
      },
    },
    {
      type: "Feature",
      id: "osm-way-1010",
      properties: {
        osm_id: 1010,
        name: "Greenfield District Central Park Pedestrian Mall",
        highway: "pedestrian",
        foot: "yes",
        surface: "paved",
        lit: "yes",
        shade_score: 80,
        lgu_city: "Mandaluyong",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [121.0542, 14.5801],
          [121.0558, 14.5812],
        ],
      },
    },
    {
      type: "Feature",
      id: "osm-way-1011",
      properties: {
        osm_id: 1011,
        name: "Legaspi Village Salcedo St Sidewalk Link",
        highway: "residential",
        foot: "yes",
        surface: "asphalt",
        lit: "yes",
        shade_score: 68,
        lgu_city: "Makati",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [121.0185, 14.5541],
          [121.0202, 14.5552],
        ],
      },
    },
    {
      type: "Feature",
      id: "osm-way-1012",
      properties: {
        osm_id: 1012,
        name: "E. Rodriguez Jr. Secondary Pedestrian Feeder",
        highway: "secondary",
        foot: "yes",
        surface: "asphalt",
        lit: "yes",
        shade_score: 55,
        lgu_city: "Pasig",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [121.0772, 14.5915],
          [121.0785, 14.5942],
        ],
      },
    },
    {
      type: "Feature",
      id: "osm-way-1013",
      properties: {
        osm_id: 1013,
        name: "Alabang Filinvest Spectrum Linear Park Footway",
        highway: "footway",
        foot: "yes",
        surface: "paved",
        lit: "yes",
        shade_score: 84,
        lgu_city: "Muntinlupa",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [121.0421, 14.4185],
          [121.0442, 14.4201],
        ],
      },
    },
    {
      type: "Feature",
      id: "osm-way-1014",
      properties: {
        osm_id: 1014,
        name: "Las Piñas Bamboo Organ Church Plaza Path",
        highway: "path",
        foot: "yes",
        surface: "stone",
        lit: "yes",
        shade_score: 75,
        lgu_city: "Las Piñas",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9818, 14.4829],
          [120.9825, 14.4835],
        ],
      },
    },
  ];

  return {
    type: "FeatureCollection",
    properties: {
      dataset_id: "DS-001",
      name: "NCR Pedestrian Walkway Network (Sample Fixture)",
      license: "ODbL - OpenStreetMap Contributors",
      generated_at: new Date().toISOString(),
      bounding_box: NCR_BOUNDING_BOX,
      total_features: sampleFeatures.length,
    },
    features: sampleFeatures,
  };
}

/**
 * Main execution entry point: filters raw features or generates sample fixture
 */
export function main(outputPath?: string): OsmFeatureCollection {
  const targetPath =
    outputPath ||
    path.resolve(process.cwd(), "data", "ncr-walkways-sample.geojson");

  const fixture = generateSampleNcrWalkways();
  const filtered = filterNcrPedestrianNetwork(fixture);

  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(targetPath, JSON.stringify(filtered, null, 2), "utf8");
  return filtered;
}

// Auto-run when invoked directly
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
