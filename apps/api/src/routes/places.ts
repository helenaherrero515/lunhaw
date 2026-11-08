import { loadPlaces } from '../data/places-source.js';
import { loadGreenIndex, presentGreenIndex } from '../data/green-index-source.js';
import { Hono } from 'hono';
import type {
  Env,
  Place,
  ProblemDetails,
  PlaceCategory,
  VerificationStatus,
  GreenIndexResult,
  GreenIndexBreakdown,
  GreenIndexInputs
} from '../types/index.js';

export const placesRoute = new Hono<{ Bindings: Env }>();

/**
 * NCR Bounding Box per api-spec.md, data-guardrails.md, and openapi.yaml
 * Valid range: 14.3°N–14.8°N, 120.9°E–121.2°E
 */
export const NCR_BOUNDS = {
  MIN_LAT: 14.3,
  MAX_LAT: 14.8,
  MIN_LNG: 120.9,
  MAX_LNG: 121.2
} as const;

/**
 * Mandatory Advisory Disclaimer Copy per INV-002 and design-system.md:
 * "Please verify operating hours directly with the facility before traveling, as local barangay schedules may change without notice."
 */
export const MANDATORY_FACILITY_DISCLAIMER =
  'Please verify operating hours directly with the facility before traveling, as local barangay schedules may change without notice.';

/**
 * Computes great-circle distance between two geographic coordinates using the Haversine formula.
 * Models PostGIS ST_DWithin geography distance logic for in-memory dataset.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * EQ-001 Green Index Glass-Box Calculator
 * Formula: Score = (0.50 * C) + (0.30 * V) + (0.20 * P)
 * Where:
 *   C = Canopy coverage percentage within boundary (0–100)
 *   V = NDVI Vegetation density scaled (0–100)
 *   P = Permeable ground surface area ratio (0–100)
 * Input Datasets: DS-001 (OSM Boundaries), DS-002 (Sentinel-2 NDVI)
 * Reference: WHO Urban Green Space Guidelines
 */
export function calculateGreenIndexScore(
  placeId: string,
  placeName: string,
  canopyPct: number,
  ndviScaled: number,
  permeablePct: number,
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'
): GreenIndexResult {
  const c = Math.max(0, Math.min(100, canopyPct));
  const v = Math.max(0, Math.min(100, ndviScaled));
  const p = Math.max(0, Math.min(100, permeablePct));

  const canopyComponent = Number((0.5 * c).toFixed(2));
  const ndviComponent = Number((0.3 * v).toFixed(2));
  const permeableComponent = Number((0.2 * p).toFixed(2));

  const totalScore = Number((canopyComponent + ndviComponent + permeableComponent).toFixed(2));

  const derivationNote =
    `EQ-001 glass-box derivation: (0.50 * ${c.toFixed(1)}% canopy) + ` +
    `(0.30 * ${v.toFixed(1)}% ndvi) + ` +
    `(0.20 * ${p.toFixed(1)}% permeable) = ${totalScore.toFixed(2)} / 100.00`;

  return {
    place_id: placeId,
    place_name: placeName,
    total_score: totalScore,
    breakdown: {
      canopy_component: canopyComponent,
      ndvi_component: ndviComponent,
      permeable_component: permeableComponent
    },
    inputs: {
      canopy_cover_pct: Number(c.toFixed(1)),
      ndvi_density_scaled: Number(v.toFixed(1)),
      permeable_surface_pct: Number(p.toFixed(1))
    },
    equation_id: 'EQ-001',
    input_dataset_ids: ['DS-001', 'DS-002'],
    confidence_level: confidence,
    verification_status: 'ESTIMATE',
    derivation_note: derivationNote,
    measured_data_source: 'Copernicus Sentinel-2 Satellite Multi-Spectral Imagery (DS-002)',
    calculated_at: new Date().toISOString()
  };
}

/**
 * Seed environmental inputs for mock facilities calibrated against ground data (DS-002)
 */
export const PLACE_GREEN_INPUTS: Record<string, GreenIndexInputs> = {
  'f0010000-0000-0000-0000-000000000020': { canopy_cover_pct: 62.0, ndvi_density_scaled: 60.0, permeable_surface_pct: 80.0 }, // NLP: 65.00
  'f0010000-0000-0000-0000-000000000021': { canopy_cover_pct: 68.0, ndvi_density_scaled: 70.0, permeable_surface_pct: 75.0 }, // Manila City Lib: 70.00
  'f0010000-0000-0000-0000-000000000022': { canopy_cover_pct: 65.0, ndvi_density_scaled: 70.0, permeable_surface_pct: 75.0 }, // Pasig: 68.50
  'f0010000-0000-0000-0000-000000000023': { canopy_cover_pct: 72.0, ndvi_density_scaled: 75.0, permeable_surface_pct: 78.5 }, // QC: 74.20
  'f0010000-0000-0000-0000-000000000024': { canopy_cover_pct: 94.0, ndvi_density_scaled: 90.0, permeable_surface_pct: 87.0 }, // Arroceros: 91.40
  'f0010000-0000-0000-0000-000000000025': { canopy_cover_pct: 82.0, ndvi_density_scaled: 86.0, permeable_surface_pct: 91.0 }, // Rizal Park: 85.00
  'f0010000-0000-0000-0000-000000000026': { canopy_cover_pct: 70.0, ndvi_density_scaled: 74.0, permeable_surface_pct: 78.0 }, // Bonifacio Shrine: 72.80
  'f0010000-0000-0000-0000-000000000027': { canopy_cover_pct: 50.0, ndvi_density_scaled: 55.0, permeable_surface_pct: 67.5 }, // Ermita Study Hub: 55.00
  'f0010000-0000-0000-0000-000000000028': { canopy_cover_pct: 77.0, ndvi_density_scaled: 80.0, permeable_surface_pct: 85.0 }, // Marikina Lib: 79.50
  'f0010000-0000-0000-0000-000000000029': { canopy_cover_pct: 89.0, ndvi_density_scaled: 88.0, permeable_surface_pct: 86.5 }, // SyCip Park: 88.20
  'f0010000-0000-0000-0000-000000000030': { canopy_cover_pct: 80.0, ndvi_density_scaled: 83.0, permeable_surface_pct: 88.5 }  // Valenzuela: 82.60
};


/**
 * Seed facilities representing all 4 categories and all 3 verification statuses (VERIFIED, ESTIMATE, NOT_AVAILABLE).
 */
export const MOCK_PLACES: Place[] = [
  {
    id: 'f0010000-0000-0000-0000-000000000020',
    name: 'National Library of the Philippines (NLP) - Main Complex',
    category: 'library',
    description: 'The premier public research library of the country with extensive air-conditioned reading halls and open study desks.',
    city: 'Manila',
    barangay: 'Ermita',
    address: 'T.M. Kalaw St, Ermita, Manila',
    coordinates: { lat: 14.5828, lng: 120.9822 },
    point_geojson: {
      type: 'Point',
      coordinates: [120.9822, 14.5828]
    },
    green_index_score: 65.0,
    verification: {
      status: 'VERIFIED',
      official_source: 'National Library of the Philippines (NLP) Directory',
      official_source_name: 'National Library of the Philippines (NLP) Directory',
      source_url: 'https://web.nlp.gov.ph',
      official_source_url: 'https://web.nlp.gov.ph',
      last_verified_at: '2026-11-01T08:00:00Z',
      verified_by: 'nlp_registered_librarian'
    },
    study_amenities: {
      desk_capacity: 450,
      has_power_outlets: true,
      has_wifi: true,
      has_aircon: true,
      has_quiet_zone: true,
      is_free_to_use: true
    },
    disclaimer: MANDATORY_FACILITY_DISCLAIMER,
    access_requirements: 'Valid government ID or student ID for library card issuance',
    schedules: [
      {
        day_of_week: 1,
        day_name: 'Monday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'NLP Administration' }
      },
      {
        day_of_week: 2,
        day_name: 'Tuesday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'NLP Administration' }
      },
      {
        day_of_week: 3,
        day_name: 'Wednesday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'NLP Administration' }
      },
      {
        day_of_week: 4,
        day_name: 'Thursday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'NLP Administration' }
      },
      {
        day_of_week: 5,
        day_name: 'Friday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'NLP Administration' }
      },
      {
        day_of_week: 6,
        day_name: 'Saturday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'NLP Administration' }
      },
      {
        day_of_week: 0,
        day_name: 'Sunday',
        open_time: null,
        close_time: null,
        is_closed: true,
        verification: { status: 'VERIFIED', official_source: 'NLP Administration' }
      }
    ]
  },
  {
    id: 'f0010000-0000-0000-0000-000000000021',
    name: 'Manila City Library - Main Branch',
    category: 'library',
    description: 'Central public library of Manila offering free public study desks, municipal references, and local history archives.',
    city: 'Manila',
    barangay: 'Ermita',
    address: 'Mehan Garden, Antonio Villegas St, Ermita, Manila',
    coordinates: { lat: 14.5935, lng: 120.9818 },
    point_geojson: {
      type: 'Point',
      coordinates: [120.9818, 14.5935]
    },
    green_index_score: 70.0,
    verification: {
      status: 'VERIFIED',
      official_source: 'City of Manila Public Library Division',
      official_source_name: 'City of Manila Public Library Division',
      source_url: 'https://manila.gov.ph/library',
      official_source_url: 'https://manila.gov.ph/library',
      last_verified_at: '2026-10-20T08:00:00Z',
      verified_by: 'manila_city_librarian'
    },
    study_amenities: {
      desk_capacity: 120,
      has_power_outlets: true,
      has_wifi: true,
      has_aircon: true,
      has_quiet_zone: true,
      is_free_to_use: true
    },
    disclaimer: MANDATORY_FACILITY_DISCLAIMER,
    access_requirements: 'Open to all Manila residents and visitors with valid photo ID',
    schedules: [
      {
        day_of_week: 1,
        day_name: 'Monday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'Manila City Library' }
      },
      {
        day_of_week: 2,
        day_name: 'Tuesday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'Manila City Library' }
      },
      {
        day_of_week: 3,
        day_name: 'Wednesday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'Manila City Library' }
      },
      {
        day_of_week: 4,
        day_name: 'Thursday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'Manila City Library' }
      },
      {
        day_of_week: 5,
        day_name: 'Friday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'Manila City Library' }
      },
      {
        day_of_week: 6,
        day_name: 'Saturday',
        open_time: '08:00:00',
        close_time: '12:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'Manila City Library' }
      },
      {
        day_of_week: 0,
        day_name: 'Sunday',
        open_time: null,
        close_time: null,
        is_closed: true,
        verification: { status: 'VERIFIED', official_source: 'Manila City Library' }
      }
    ]
  },
  {
    id: 'c1f7a0b3-6c7e-4d8a-9f5e-123456789abc',
    name: 'Barangay San Antonio Reading Center',
    category: 'reading_center',
    description: 'Community reading nook and quiet study hall maintained by Barangay San Antonio.',
    city: 'Pasig',
    barangay: 'San Antonio',
    address: 'San Antonio Community Complex, Pasig',
    coordinates: { lat: 14.5823, lng: 121.0611 },
    point_geojson: {
      type: 'Point',
      coordinates: [121.0611, 14.5823]
    },
    green_index_score: 68.5,
    verification: {
      status: 'VERIFIED',
      official_source: 'Pasig LGU Public Affairs',
      official_source_name: 'Pasig LGU Public Affairs',
      source_url: 'https://pasigcity.gov.ph/reading-centers',
      official_source_url: 'https://pasigcity.gov.ph/reading-centers',
      last_verified_at: '2026-09-15T08:00:00Z',
      verified_by: 'Pasig LGU Ingestion v1'
    },
    study_amenities: {
      desk_capacity: 25,
      has_power_outlets: true,
      has_wifi: true,
      has_aircon: true,
      has_quiet_zone: true,
      is_free_to_use: true
    },
    disclaimer: MANDATORY_FACILITY_DISCLAIMER,
    access_requirements: 'Valid student or government-issued ID required.',
    schedules: [
      {
        day_of_week: 1,
        day_name: 'Monday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'Pasig LGU Public Affairs' }
      },
      {
        day_of_week: 2,
        day_name: 'Tuesday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'Pasig LGU Public Affairs' }
      },
      {
        day_of_week: 3,
        day_name: 'Wednesday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'Pasig LGU Public Affairs' }
      },
      {
        day_of_week: 4,
        day_name: 'Thursday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'Pasig LGU Public Affairs' }
      },
      {
        day_of_week: 5,
        day_name: 'Friday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'Pasig LGU Public Affairs' }
      },
      {
        day_of_week: 6,
        day_name: 'Saturday',
        open_time: null,
        close_time: null,
        is_closed: true,
        verification: { status: 'VERIFIED', official_source: 'Pasig LGU Public Affairs' }
      },
      {
        day_of_week: 0,
        day_name: 'Sunday',
        open_time: null,
        close_time: null,
        is_closed: true,
        verification: { status: 'VERIFIED', official_source: 'Pasig LGU Public Affairs' }
      }
    ]
  },
  {
    id: 'a2b8c9d0-1e2f-3a4b-5c6d-7e8f9a0b1c2d',
    name: 'Quezon City Public Library - Main Branch',
    category: 'library',
    description: 'The main central public library of Quezon City with multi-level study carrels and air-conditioned reading halls.',
    city: 'Quezon City',
    barangay: 'Central',
    address: 'City Hall Compound, Elliptical Road, Diliman, Quezon City',
    coordinates: { lat: 14.6465, lng: 121.0494 },
    point_geojson: {
      type: 'Point',
      coordinates: [121.0494, 14.6465]
    },
    green_index_score: 74.2,
    verification: {
      status: 'VERIFIED',
      official_source: 'QC Public Library Management',
      official_source_name: 'QC Public Library Management',
      source_url: 'https://qcpubliclibrary.quezoncity.gov.ph',
      official_source_url: 'https://qcpubliclibrary.quezoncity.gov.ph',
      last_verified_at: '2026-10-01T09:00:00Z',
      verified_by: 'QC LGU Ingestion v1'
    },
    study_amenities: {
      desk_capacity: 150,
      has_power_outlets: true,
      has_wifi: true,
      has_aircon: true,
      has_quiet_zone: true,
      is_free_to_use: true
    },
    disclaimer: MANDATORY_FACILITY_DISCLAIMER,
    access_requirements: 'Open to the public with free library card registration.',
    schedules: [
      {
        day_of_week: 1,
        day_name: 'Monday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'QC Public Library Management' }
      },
      {
        day_of_week: 2,
        day_name: 'Tuesday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'QC Public Library Management' }
      },
      {
        day_of_week: 3,
        day_name: 'Wednesday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'QC Public Library Management' }
      },
      {
        day_of_week: 4,
        day_name: 'Thursday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'QC Public Library Management' }
      },
      {
        day_of_week: 5,
        day_name: 'Friday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'QC Public Library Management' }
      },
      {
        day_of_week: 6,
        day_name: 'Saturday',
        open_time: '08:00:00',
        close_time: '12:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED', official_source: 'QC Public Library Management' }
      },
      {
        day_of_week: 0,
        day_name: 'Sunday',
        open_time: null,
        close_time: null,
        is_closed: true,
        verification: { status: 'VERIFIED', official_source: 'QC Public Library Management' }
      }
    ]
  },
  {
    id: 'd3e4f5a6-7b8c-9d0e-1f2a-3b4c5d6e7f8a',
    name: 'Arroceros Forest Park',
    category: 'park',
    description: "Referred to as Manila's Last Lung, an urban riverside forest park featuring lush canopy shade.",
    city: 'Manila',
    barangay: 'Ermita',
    address: 'Antonio Villegas St, Ermita, Manila',
    coordinates: { lat: 14.5947, lng: 120.9822 },
    point_geojson: {
      type: 'Point',
      coordinates: [120.9822, 14.5947]
    },
    boundary_geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [120.9815, 14.5942],
          [120.983, 14.5942],
          [120.983, 14.5955],
          [120.9815, 14.5955],
          [120.9815, 14.5942]
        ]
      ]
    },
    green_index_score: 91.4,
    verification: {
      status: 'VERIFIED',
      official_source: 'City of Manila Parks Development Office',
      official_source_name: 'City of Manila Parks Development Office',
      source_url: 'https://manila.gov.ph/arroceros-forest-park',
      official_source_url: 'https://manila.gov.ph/arroceros-forest-park',
      last_verified_at: '2026-08-20T10:00:00Z',
      verified_by: 'Manila City Parks Survey'
    },
    study_amenities: {
      desk_capacity: 10,
      has_power_outlets: false,
      has_wifi: false,
      has_aircon: false,
      has_quiet_zone: true,
      is_free_to_use: true
    },
    disclaimer: MANDATORY_FACILITY_DISCLAIMER,
    access_requirements: 'Public park; free admission.',
    schedules: [
      {
        day_of_week: 1,
        day_name: 'Monday',
        open_time: '05:00:00',
        close_time: '18:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED' }
      },
      {
        day_of_week: 2,
        day_name: 'Tuesday',
        open_time: '05:00:00',
        close_time: '18:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED' }
      },
      {
        day_of_week: 3,
        day_name: 'Wednesday',
        open_time: '05:00:00',
        close_time: '18:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED' }
      },
      {
        day_of_week: 4,
        day_name: 'Thursday',
        open_time: '05:00:00',
        close_time: '18:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED' }
      },
      {
        day_of_week: 5,
        day_name: 'Friday',
        open_time: '05:00:00',
        close_time: '18:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED' }
      },
      {
        day_of_week: 6,
        day_name: 'Saturday',
        open_time: '05:00:00',
        close_time: '18:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED' }
      },
      {
        day_of_week: 0,
        day_name: 'Sunday',
        open_time: '05:00:00',
        close_time: '18:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED' }
      }
    ]
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    name: 'Rizal Park (Luneta)',
    category: 'park',
    description: 'One of the largest urban parks in the Philippines, featuring wide open lawns and ornamental gardens.',
    city: 'Manila',
    barangay: 'Ermita',
    address: 'Roxas Blvd, Ermita, Manila',
    coordinates: { lat: 14.5831, lng: 120.9794 },
    point_geojson: {
      type: 'Point',
      coordinates: [120.9794, 14.5831]
    },
    boundary_geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [120.975, 14.58],
          [120.983, 14.58],
          [120.983, 14.586],
          [120.975, 14.586],
          [120.975, 14.58]
        ]
      ]
    },
    green_index_score: 85.0,
    verification: {
      status: 'VERIFIED',
      official_source: 'National Parks Development Committee (NPDC)',
      official_source_name: 'National Parks Development Committee (NPDC)',
      source_url: 'https://npdc.gov.ph/luneta-park',
      official_source_url: 'https://npdc.gov.ph/luneta-park',
      last_verified_at: '2026-02-01T09:30:00Z',
      verified_by: 'NPDC Open Data Portal'
    },
    study_amenities: {
      desk_capacity: 0,
      has_power_outlets: false,
      has_wifi: false,
      has_aircon: false,
      has_quiet_zone: true,
      is_free_to_use: true
    },
    disclaimer: MANDATORY_FACILITY_DISCLAIMER,
    access_requirements: 'Public national park; open daily.',
    schedules: [
      {
        day_of_week: 1,
        day_name: 'Monday',
        open_time: '05:00:00',
        close_time: '21:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED' }
      }
    ]
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    name: 'Paco Park & Cemetery Garden',
    category: 'garden',
    description: 'Historical circular cemetery garden surrounded by stone walls and lush canopy trees.',
    city: 'Manila',
    barangay: 'Paco',
    address: 'Bel-Air St, Paco, Manila',
    coordinates: { lat: 14.5815, lng: 120.9882 },
    point_geojson: {
      type: 'Point',
      coordinates: [120.9882, 14.5815]
    },
    green_index_score: 72.8,
    verification: {
      status: 'ESTIMATE',
      derivation_note: 'Canopy estimated from Sentinel-2 10m NDVI composite with LGU boundary overlay via EQ-002.',
      last_verified_at: '2026-02-10T14:15:00Z',
      verified_by: 'Lunhaw Automated NDVI Pipeline v0.4'
    },
    study_amenities: {
      desk_capacity: 8,
      has_power_outlets: false,
      has_wifi: false,
      has_aircon: false,
      has_quiet_zone: true,
      is_free_to_use: false
    },
    disclaimer: MANDATORY_FACILITY_DISCLAIMER,
    access_requirements: 'Standard nominal park conservation entrance fee applies.',
    schedules: [
      {
        day_of_week: 1,
        day_name: 'Monday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: {
          status: 'ESTIMATE',
          derivation_note: 'Estimated from published NPDC operational hours schedule.'
        }
      }
    ]
  },
  {
    id: '20000000-0000-0000-0000-000000000004',
    name: 'Barangay Pinyahan Community Reading Center',
    category: 'reading_center',
    description: 'Neighborhood quiet reading nook and public homework center for barangay residents.',
    city: 'Quezon City',
    barangay: 'Pinyahan',
    address: 'Malakas St, Brgy Pinyahan, Quezon City',
    coordinates: { lat: 14.6419, lng: 121.0521 },
    point_geojson: {
      type: 'Point',
      coordinates: [121.0521, 14.6419]
    },
    green_index_score: 55.0,
    verification: {
      status: 'NOT_AVAILABLE',
      official_source: 'Manual Field Survey Pending',
      last_verified_at: null,
      derivation_note: null
    },
    study_amenities: {
      desk_capacity: 24,
      has_power_outlets: true,
      has_wifi: false,
      has_aircon: true,
      has_quiet_zone: true,
      is_free_to_use: true
    },
    disclaimer: MANDATORY_FACILITY_DISCLAIMER,
    access_requirements: 'Barangay resident verification may be requested.',
    schedules: [
      {
        day_of_week: 1,
        day_name: 'Monday',
        open_time: '08:30:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'NOT_AVAILABLE' }
      }
    ]
  },
  {
    id: '30000000-0000-0000-0000-000000000001',
    name: 'Marikina City Library',
    category: 'library',
    description: 'Public library and student research center with quiet reading rooms and power outlets.',
    city: 'Marikina',
    barangay: 'Santa Elena',
    address: 'V. Gomez St, Santa Elena, Marikina',
    coordinates: { lat: 14.6335, lng: 121.0968 },
    point_geojson: {
      type: 'Point',
      coordinates: [121.0968, 14.6335]
    },
    green_index_score: 79.5,
    verification: {
      status: 'VERIFIED',
      official_source: 'Marikina City Hall Public Library',
      official_source_name: 'Marikina City Hall Public Library',
      source_url: 'https://marikina.gov.ph/services/library',
      official_source_url: 'https://marikina.gov.ph/services/library',
      last_verified_at: '2026-09-01T10:00:00Z',
      verified_by: 'Marikina LGU Portal'
    },
    study_amenities: {
      desk_capacity: 80,
      has_power_outlets: true,
      has_wifi: true,
      has_aircon: true,
      has_quiet_zone: true,
      is_free_to_use: true
    },
    disclaimer: MANDATORY_FACILITY_DISCLAIMER,
    access_requirements: 'Free admission for all students and residents.',
    schedules: [
      {
        day_of_week: 1,
        day_name: 'Monday',
        open_time: '08:00:00',
        close_time: '17:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED' }
      }
    ]
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    name: 'Ayala Triangle Gardens',
    category: 'garden',
    description: 'Prominent triangular urban park with towering rain trees and landscaped courtyards in the central business district.',
    city: 'Makati',
    barangay: 'Bel-Air',
    address: 'Paseo de Roxas cor. Makati Ave, Makati',
    coordinates: { lat: 14.5574, lng: 121.0232 },
    point_geojson: {
      type: 'Point',
      coordinates: [121.0232, 14.5574]
    },
    green_index_score: 88.2,
    verification: {
      status: 'VERIFIED',
      official_source: 'Makati City Environmental Services Department',
      official_source_name: 'Makati City Environmental Services Department',
      source_url: 'https://makati.gov.ph/parks/ayala-triangle',
      official_source_url: 'https://makati.gov.ph/parks/ayala-triangle',
      last_verified_at: '2026-09-10T11:00:00Z',
      verified_by: 'Makati LGU Open Directory'
    },
    study_amenities: {
      desk_capacity: 20,
      has_power_outlets: false,
      has_wifi: true,
      has_aircon: false,
      has_quiet_zone: true,
      is_free_to_use: true
    },
    disclaimer: MANDATORY_FACILITY_DISCLAIMER,
    access_requirements: 'Open public garden.',
    schedules: [
      {
        day_of_week: 1,
        day_name: 'Monday',
        open_time: '06:00:00',
        close_time: '22:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED' }
      }
    ]
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    name: "Valenzuela People's Park",
    category: 'park',
    description: 'Sprawling interactive community park with shaded promenades, amphitheater, and children playground.',
    city: 'Valenzuela',
    barangay: 'Karuhatan',
    address: 'MacArthur Hwy, Karuhatan, Valenzuela',
    coordinates: { lat: 14.6853, lng: 120.9781 },
    point_geojson: {
      type: 'Point',
      coordinates: [120.9781, 14.6853]
    },
    green_index_score: 82.6,
    verification: {
      status: 'VERIFIED',
      official_source: 'Valenzuela City Public Information Office',
      official_source_name: 'Valenzuela City Public Information Office',
      source_url: 'https://valenzuela.gov.ph/peoples-park',
      official_source_url: 'https://valenzuela.gov.ph/peoples-park',
      last_verified_at: '2026-08-15T09:00:00Z',
      verified_by: 'Valenzuela LGU Ingestion'
    },
    study_amenities: {
      desk_capacity: 30,
      has_power_outlets: false,
      has_wifi: true,
      has_aircon: false,
      has_quiet_zone: true,
      is_free_to_use: true
    },
    disclaimer: MANDATORY_FACILITY_DISCLAIMER,
    access_requirements: 'Public park open to all visitors.',
    schedules: [
      {
        day_of_week: 1,
        day_name: 'Monday',
        open_time: '05:00:00',
        close_time: '23:00:00',
        is_closed: false,
        verification: { status: 'VERIFIED' }
      }
    ]
  }
];

/**
 * GET /places - Search & Filter (A-M1-02, F-001, BR-001, INV-003)
 * Supports query, category, city, barangay, lat/lng/radius_km, and amenities filters.
 */
placesRoute.get('/', async (c) => {
  const query = c.req.query('query')?.toLowerCase().trim();
  const category = c.req.query('category') as PlaceCategory | undefined;
  const city = c.req.query('city')?.toLowerCase().trim();
  const barangay = c.req.query('barangay')?.toLowerCase().trim();
  const rawLat = c.req.query('lat');
  const rawLng = c.req.query('lng');
  const rawRadius = c.req.query('radius_km');
  const rawAmenities = c.req.query('amenities');
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(c.req.query('per_page') || '20', 10)));

  // 1. Coordinate Validation within NCR bounds
  let centerLat: number | null = null;
  let centerLng: number | null = null;
  let searchRadiusKm = 5.0; // default 5.0 km per openapi.yaml

  if (rawLat !== undefined || rawLng !== undefined) {
    if (rawLat === undefined || rawLng === undefined) {
      const problem: ProblemDetails = {
        type: 'https://api.lunhaw.ph/errors/ERR_INVALID_COORDINATES',
        title: 'Incomplete Coordinates',
        status: 400,
        detail: 'Both lat and lng parameters are required for coordinate search.',
        instance: c.req.path,
        code: 'ERR_INVALID_COORDINATES',
        invalid_params: [
          ...(rawLat === undefined ? [{ name: 'lat', reason: 'Missing latitude parameter' }] : []),
          ...(rawLng === undefined ? [{ name: 'lng', reason: 'Missing longitude parameter' }] : [])
        ]
      };
      return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
    }

    const parsedLat = parseFloat(rawLat);
    const parsedLng = parseFloat(rawLng);

    const isLatValid = !isNaN(parsedLat) && parsedLat >= NCR_BOUNDS.MIN_LAT && parsedLat <= NCR_BOUNDS.MAX_LAT;
    const isLngValid = !isNaN(parsedLng) && parsedLng >= NCR_BOUNDS.MIN_LNG && parsedLng <= NCR_BOUNDS.MAX_LNG;

    if (!isLatValid || !isLngValid) {
      const problem: ProblemDetails = {
        type: 'https://api.lunhaw.ph/errors/ERR_INVALID_COORDINATES',
        title: 'Coordinates Out of Bounds',
        status: 400,
        detail: `Coordinates (${rawLat}, ${rawLng}) lie outside the valid NCR bounding box: ${NCR_BOUNDS.MIN_LAT}°N–${NCR_BOUNDS.MAX_LAT}°N, ${NCR_BOUNDS.MIN_LNG}°E–${NCR_BOUNDS.MAX_LNG}°E.`,
        instance: c.req.path,
        code: 'ERR_INVALID_COORDINATES',
        invalid_params: [
          ...(!isLatValid
            ? [{ name: 'lat', reason: `Latitude must be between ${NCR_BOUNDS.MIN_LAT} and ${NCR_BOUNDS.MAX_LAT}` }]
            : []),
          ...(!isLngValid
            ? [{ name: 'lng', reason: `Longitude must be between ${NCR_BOUNDS.MIN_LNG} and ${NCR_BOUNDS.MAX_LNG}` }]
            : [])
        ]
      };
      return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
    }

    centerLat = parsedLat;
    centerLng = parsedLng;

    if (rawRadius !== undefined) {
      const parsedRadius = parseFloat(rawRadius);
      if (isNaN(parsedRadius) || parsedRadius < 0.1 || parsedRadius > 25.0) {
        const problem: ProblemDetails = {
          type: 'https://api.lunhaw.ph/errors/ERR_INVALID_COORDINATES',
          title: 'Invalid Radius Parameter',
          status: 400,
          detail: `radius_km must be a number between 0.1 and 25.0 km per T-004. Got: ${rawRadius}`,
          instance: c.req.path,
          code: 'ERR_INVALID_COORDINATES',
          invalid_params: [{ name: 'radius_km', reason: 'Value must be between 0.1 and 25.0 km' }]
        };
        return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
      }
      searchRadiusKm = parsedRadius;
    }
  }

  // 2. Filter facilities (database in deployed environments, fixtures in local dev/tests)
  let results = await loadPlaces(c.env, MOCK_PLACES);

  // Category filter
  if (category) {
    results = results.filter((p) => p.category === category);
  }

  // City filter
  if (city) {
    results = results.filter((p) => p.city.toLowerCase() === city);
  }

  // Barangay filter
  if (barangay) {
    results = results.filter(
      (p) =>
        p.barangay.toLowerCase().includes(barangay) ||
        p.address.toLowerCase().includes(barangay)
    );
  }

  // Free-text query
  if (query) {
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.address.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query) ||
        p.barangay.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    );
  }

  // Study amenities filter
  if (rawAmenities) {
    const requiredAmenities = rawAmenities
      .split(',')
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean);

    if (requiredAmenities.length > 0) {
      results = results.filter((p) => {
        if (!p.study_amenities) return false;
        return requiredAmenities.every((amenity) => {
          switch (amenity) {
            case 'power':
              return p.study_amenities?.has_power_outlets === true;
            case 'wifi':
              return p.study_amenities?.has_wifi === true;
            case 'aircon':
              return p.study_amenities?.has_aircon === true;
            case 'desks':
            case 'desk':
              return (p.study_amenities?.desk_capacity ?? 0) > 0;
            case 'quiet':
              return p.study_amenities?.has_quiet_zone === true;
            case 'free':
              return p.study_amenities?.is_free_to_use === true;
            default:
              return true;
          }
        });
      });
    }
  }

  // Radius distance filter (ST_DWithin logic)
  if (centerLat !== null && centerLng !== null) {
    const targetLat = centerLat;
    const targetLng = centerLng;

    const placesWithDistance = results
      .map((p) => {
        const distKm = calculateHaversineDistanceKm(
          targetLat,
          targetLng,
          p.coordinates.lat,
          p.coordinates.lng
        );
        return {
          place: p,
          distanceKm: distKm
        };
      })
      .filter((item) => item.distanceKm <= searchRadiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    results = placesWithDistance.map((item) => ({
      ...item.place,
      distance_km: Math.round(item.distanceKm * 100) / 100
    }));
  }

  const total = results.length;
  const startIndex = (page - 1) * perPage;
  const paginated = results.slice(startIndex, startIndex + perPage);

  return c.json({
    status: 'success',
    data: {
      places: paginated.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        city: p.city,
        barangay: p.barangay,
        address: p.address,
        coordinates: p.coordinates,
        point_geojson: p.point_geojson,
        green_index_score: p.green_index_score,
        verification: p.verification,
        study_amenities: p.study_amenities,
        distance_km: p.distance_km
      })),
      pagination: {
        page,
        per_page: perPage,
        total
      }
    }
  });
});

/**
 * GET /places/:id - Place Profile & Operating Hours (A-M1-03, F-002, INV-001, INV-002)
 * Returns detailed facility profile with mandatory advisory disclaimer and explicit tri-state integrity status.
 */
placesRoute.get('/:id', async (c) => {
  const id = c.req.param('id');
  const place = (await loadPlaces(c.env, MOCK_PLACES)).find((p) => p.id === id);

  if (!place) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_PLACE_NOT_FOUND',
      title: 'Place Not Found',
      status: 404,
      detail: `Facility record with ID '${id}' does not exist.`,
      instance: c.req.path,
      code: 'ERR_PLACE_NOT_FOUND'
    };
    return c.json(problem, 404, { 'Content-Type': 'application/problem+json' });
  }

  // Data Honesty (INV-001, BR-001): Ensure tri-state status on facility and every schedule record
  const verifiedSchedules = (place.schedules || []).map((s) => ({
    ...s,
    verification: s.verification || {
      status: ('NOT_AVAILABLE' as VerificationStatus)
    }
  }));

  // Invariant INV-002: Mandatory advisory disclaimer MUST always be injected
  return c.json({
    status: 'success',
    data: {
      ...place,
      disclaimer: MANDATORY_FACILITY_DISCLAIMER,
      schedules: verifiedSchedules,
      verification: place.verification || {
        status: ('NOT_AVAILABLE' as VerificationStatus)
      }
    }
  });
});

/**
 * GET /places/:id/green-score (A-M2-03, F-004, BR-003, EQ-001)
 * Exposes computed Green Index (0-100) and environmental subscores
 * with glass-box mathematical transparency per EQ-001:
 * Score = (0.50 * Canopy%) + (0.30 * NDVI%) + (0.20 * Permeable%)
 */
placesRoute.get('/:id/green-score', async (c) => {
  const id = c.req.param('id');
  const place = (await loadPlaces(c.env, MOCK_PLACES)).find((p) => p.id === id);

  if (!place) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_PLACE_NOT_FOUND',
      title: 'Place Not Found',
      status: 404,
      detail: `Facility record with ID '${id}' does not exist.`,
      instance: c.req.path,
      code: 'ERR_PLACE_NOT_FOUND'
    };
    return c.json(problem, 404, { 'Content-Type': 'application/problem+json' });
  }

  // Allow query overrides for calibration/unit tests (e.g. TC-004)
  const qCanopy = c.req.query('canopy');
  const qNdvi = c.req.query('ndvi');
  const qPermeable = c.req.query('permeable');

  let inputs: GreenIndexInputs;
  if (qCanopy !== undefined && qNdvi !== undefined && qPermeable !== undefined) {
    inputs = {
      canopy_cover_pct: parseFloat(qCanopy) || 0,
      ndvi_density_scaled: parseFloat(qNdvi) || 0,
      permeable_surface_pct: parseFloat(qPermeable) || 0
    };
  } else {
    const baseline = PLACE_GREEN_INPUTS[place.id];
    if (!baseline) {
      // INV-001 / BR-003: without measured inputs there is no score. Never fall back to a made-up value.
      return c.json({
        status: 'success',
        data: {
          place_id: place.id,
          place_name: place.name,
          score: null,
          verification: {
            status: 'NOT_AVAILABLE' as VerificationStatus,
            derivation_note: 'No measured canopy, vegetation or surface data is available for this place yet.'
          }
        }
      });
    }
    inputs = baseline;
  }

  const result = calculateGreenIndexScore(
    place.id,
    place.name,
    inputs.canopy_cover_pct,
    inputs.ndvi_density_scaled,
    inputs.permeable_surface_pct,
    'MEDIUM'
  );

  return c.json({
    status: 'success',
    data: result
  });
});

/**
 * GET /places/:id/green-index (EQ-005, BR-003, INV-001)
 * The place's published Green Index: a rounded 0-100 score, band, uncertainty range, components against
 * their targets, imagery dates, data credits and caveats. Always an ESTIMATE. Places whose result has not
 * been photo-checked and published answer NOT_AVAILABLE; a number is never made up.
 */
placesRoute.get('/:id/green-index', async (c) => {
  const id = c.req.param('id');
  const place = (await loadPlaces(c.env, MOCK_PLACES)).find((p) => p.id === id);
  if (!place) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_PLACE_NOT_FOUND',
      title: 'Place Not Found',
      status: 404,
      detail: `Facility record with ID '${id}' does not exist.`,
      instance: c.req.path,
      code: 'ERR_PLACE_NOT_FOUND'
    };
    return c.json(problem, 404, { 'Content-Type': 'application/problem+json' });
  }
  const row = await loadGreenIndex(c.env, id);
  if (!row) {
    return c.json({
      status: 'success',
      data: {
        place_id: id,
        status: 'NOT_AVAILABLE' as VerificationStatus,
        note: 'The Green Index for this place has not been checked and published yet.'
      }
    });
  }
  return c.json({ status: 'success', data: { place_id: id, ...presentGreenIndex(row) } });
});
