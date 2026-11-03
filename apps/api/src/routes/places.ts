import { Hono } from 'hono';
import type { Env, Place, ProblemDetails } from '../types/index.js';

export const placesRoute = new Hono<{ Bindings: Env }>();

// NCR Bounding Box per api-spec.md and data-guardrails.md
export const NCR_BOUNDS = {
  MIN_LAT: 14.3,
  MAX_LAT: 14.8,
  MIN_LNG: 120.9,
  MAX_LNG: 121.2
} as const;

export const MANDATORY_FACILITY_DISCLAIMER =
  'Please verify operating hours directly with the facility before traveling, as barangay schedules may change without notice.';

// Mock Seed Facilities for M0 scaffold
const MOCK_PLACES: Place[] = [
  {
    id: 'c1f7a0b3-6c7e-4d8a-9f5e-123456789abc',
    name: 'Barangay San Antonio Reading Center',
    category: 'reading_center',
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
      source_url: 'https://pasigcity.gov.ph/reading-centers',
      last_verified_at: '2026-09-15T08:00:00Z'
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
      source_url: 'https://qcpubliclibrary.quezoncity.gov.ph',
      last_verified_at: '2026-10-01T09:00:00Z'
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
        verification: { status: 'VERIFIED' }
      }
    ]
  },
  {
    id: 'd3e4f5a6-7b8c-9d0e-1f2a-3b4c5d6e7f8a',
    name: 'Arroceros Forest Park',
    category: 'park',
    city: 'Manila',
    barangay: 'Barangay 659',
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
          [120.9830, 14.5942],
          [120.9830, 14.5955],
          [120.9815, 14.5955],
          [120.9815, 14.5942]
        ]
      ]
    },
    green_index_score: 91.4,
    verification: {
      status: 'VERIFIED',
      official_source: 'City of Manila Parks Development Office',
      source_url: 'https://manila.gov.ph/arroceros-forest-park',
      last_verified_at: '2026-08-20T10:00:00Z'
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
      }
    ]
  }
];

// GET /places - Search & Filter
placesRoute.get('/', (c) => {
  const query = c.req.query('query')?.toLowerCase();
  const category = c.req.query('category');
  const city = c.req.query('city')?.toLowerCase();
  const barangay = c.req.query('barangay')?.toLowerCase();
  const rawLat = c.req.query('lat');
  const rawLng = c.req.query('lng');
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(c.req.query('per_page') || '20', 10)));

  // Coordinate Validation within NCR bounds
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

    const lat = parseFloat(rawLat);
    const lng = parseFloat(rawLng);

    const isLatValid = !isNaN(lat) && lat >= NCR_BOUNDS.MIN_LAT && lat <= NCR_BOUNDS.MAX_LAT;
    const isLngValid = !isNaN(lng) && lng >= NCR_BOUNDS.MIN_LNG && lng <= NCR_BOUNDS.MAX_LNG;

    if (!isLatValid || !isLngValid) {
      const problem: ProblemDetails = {
        type: 'https://api.lunhaw.ph/errors/ERR_INVALID_COORDINATES',
        title: 'Coordinates Out of Bounds',
        status: 400,
        detail: `Coordinates (${rawLat}, ${rawLng}) lie outside the valid NCR bounding box: ${NCR_BOUNDS.MIN_LAT}°N–${NCR_BOUNDS.MAX_LAT}°N, ${NCR_BOUNDS.MIN_LNG}°E–${NCR_BOUNDS.MAX_LNG}°E.`,
        instance: c.req.path,
        code: 'ERR_INVALID_COORDINATES',
        invalid_params: [
          ...(!isLatValid ? [{ name: 'lat', reason: `Latitude must be between ${NCR_BOUNDS.MIN_LAT} and ${NCR_BOUNDS.MAX_LAT}` }] : []),
          ...(!isLngValid ? [{ name: 'lng', reason: `Longitude must be between ${NCR_BOUNDS.MIN_LNG} and ${NCR_BOUNDS.MAX_LNG}` }] : [])
        ]
      };
      return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
    }
  }

  // Filter facilities
  let results = MOCK_PLACES;

  if (category) {
    results = results.filter((p) => p.category === category);
  }
  if (city) {
    results = results.filter((p) => p.city.toLowerCase() === city);
  }
  if (barangay) {
    results = results.filter((p) => p.barangay.toLowerCase().includes(barangay));
  }
  if (query) {
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.address.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query)
    );
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
        city: p.city,
        barangay: p.barangay,
        address: p.address,
        coordinates: p.coordinates,
        point_geojson: p.point_geojson,
        green_index_score: p.green_index_score,
        verification: p.verification,
        study_amenities: p.study_amenities
      })),
      pagination: {
        page,
        per_page: perPage,
        total
      }
    }
  });
});

// GET /places/:id - Detailed Place Record & Hours
placesRoute.get('/:id', (c) => {
  const id = c.req.param('id');
  const place = MOCK_PLACES.find((p) => p.id === id);

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

  // Mandatory facility disclaimer invariant (INV-002) is always present
  return c.json({
    status: 'success',
    data: {
      ...place,
      disclaimer: place.disclaimer || MANDATORY_FACILITY_DISCLAIMER
    }
  });
});
