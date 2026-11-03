import { Hono } from 'hono';
import type { Env, GeoJSONFeatureCollection, GeoJSONLineString, GeoJSONPoint } from '../types/index.js';

export const transitRoute = new Hono<{ Bindings: Env }>();

/**
 * Static Transit Network FeatureCollection for Metro Manila (NCR)
 * Complies with RFC 7946 GeoJSON, Invariant INV-003 (Platform-Neutral), and F-003.
 * Data sources: DOTr, LRTA, MRTC, and LTFRB Official Gazette (DS-001, DS-003).
 */
export const TRANSIT_NETWORK_GEOJSON: GeoJSONFeatureCollection<
  GeoJSONLineString | GeoJSONPoint,
  Record<string, unknown>
> = {
  type: 'FeatureCollection',
  properties: {
    title: 'Metro Manila Rail & Transit Network Graph',
    version: '1.0.0',
    coverage: 'NCR (Metro Manila)',
    updated_at: '2026-11-01T00:00:00Z',
    verification: {
      status: 'VERIFIED',
      official_source: 'DOTr, LRTA, MRTC & LTFRB Official Route Directories',
      official_source_url: 'https://dotr.gov.ph',
      last_verified_at: '2026-11-01T00:00:00Z'
    },
    schedule_baselines: {
      mrt3: {
        line_name: 'Metro Rail Transit Line 3 (MRT-3)',
        operating_hours: '04:30 - 22:30',
        peak_headway_minutes: 4,
        off_peak_headway_minutes: 7,
        fare_matrix: {
          base_fare_php: 13.0,
          base_distance_km: 2.0,
          rate_per_excess_km: 1.0,
          equation_id: 'EQ-004',
          dataset_id: 'DS-003'
        }
      },
      lrt1: {
        line_name: 'Light Rail Transit Line 1 (LRT-1)',
        operating_hours: '04:30 - 22:00',
        peak_headway_minutes: 3.5,
        off_peak_headway_minutes: 6,
        fare_matrix: {
          base_fare_php: 15.0,
          base_distance_km: 2.0,
          rate_per_excess_km: 1.21,
          equation_id: 'EQ-004',
          dataset_id: 'DS-003'
        }
      },
      lrt2: {
        line_name: 'Light Rail Transit Line 2 (LRT-2)',
        operating_hours: '05:00 - 21:30',
        peak_headway_minutes: 5,
        off_peak_headway_minutes: 8,
        fare_matrix: {
          base_fare_php: 15.0,
          base_distance_km: 2.0,
          rate_per_excess_km: 1.21,
          equation_id: 'EQ-004',
          dataset_id: 'DS-003'
        }
      },
      edsa_carousel: {
        line_name: 'EDSA Busway Carousel',
        operating_hours: '24/7 (Continuous)',
        peak_headway_minutes: 3,
        off_peak_headway_minutes: 10,
        fare_matrix: {
          base_fare_php: 15.0,
          base_distance_km: 5.0,
          rate_per_excess_km: 2.65,
          equation_id: 'EQ-004',
          dataset_id: 'DS-003'
        }
      },
      traditional_jeepney: {
        line_name: 'Traditional PUJ Network',
        operating_hours: '05:00 - 23:00',
        headway_minutes: 3,
        fare_matrix: {
          base_fare_php: 13.0,
          base_distance_km: 4.0,
          rate_per_excess_km: 1.8,
          equation_id: 'EQ-004',
          dataset_id: 'DS-003'
        }
      },
      modern_jeepney: {
        line_name: 'Modern PUJ (MPUJ) Network',
        operating_hours: '05:00 - 23:00',
        headway_minutes: 4,
        fare_matrix: {
          base_fare_php: 15.0,
          base_distance_km: 4.0,
          rate_per_excess_km: 2.2,
          equation_id: 'EQ-004',
          dataset_id: 'DS-003'
        }
      }
    }
  },
  features: [
    // -------------------------------------------------------------
    // TRANSIT LINES (LineStrings)
    // -------------------------------------------------------------
    {
      type: 'Feature',
      id: 'line-mrt3',
      geometry: {
        type: 'LineString',
        coordinates: [
          [121.0333, 14.6525], // North Avenue
          [121.0389, 14.6425], // Quezon Avenue
          [121.0436, 14.6347], // GMA-Kamuning
          [121.0528, 14.6194], // Araneta Center-Cubao
          [121.0567, 14.6078], // Santolan-Annapolis
          [121.0583, 14.5878], // Ortigas
          [121.0536, 14.5811], // Shaw Boulevard
          [121.0456, 14.5739], // Boni
          [121.0411, 14.5672], // Guadalupe
          [121.0319, 14.5542], // Buendia
          [121.0281, 14.5492], // Ayala
          [121.0197, 14.5422], // Magallanes
          [121.0006, 14.5375]  // Taft Avenue
        ]
      },
      properties: {
        feature_type: 'transit_line',
        line_id: 'MRT-3',
        name: 'Metro Rail Transit Line 3',
        short_name: 'MRT-3',
        mode: 'rail',
        color: '#0055A5',
        total_stations: 13,
        terminus_north: 'North Avenue',
        terminus_south: 'Taft Avenue',
        fare_type: 'mrt3',
        base_fare_php: 13.0,
        rate_per_km: 1.0,
        operating_hours: '04:30 - 22:30'
      }
    },
    {
      type: 'Feature',
      id: 'line-lrt1',
      geometry: {
        type: 'LineString',
        coordinates: [
          [121.0211, 14.6575], // Fernando Poe Jr. (Roosevelt)
          [121.0014, 14.6575], // Balintawak
          [120.9839, 14.6542], // Monumento
          [120.9831, 14.6436], // 5th Avenue
          [120.9825, 14.6347], // R. Papa
          [120.9822, 14.6272], // Abad Santos
          [120.9819, 14.6194], // Blumentritt
          [120.9822, 14.6128], // Tayuman
          [120.9822, 14.6083], // Bambang
          [120.9822, 14.6053], // Doroteo Jose
          [120.9819, 14.5986], // Carriedo
          [120.9814, 14.5928], // Central Terminal
          [120.9836, 14.5828], // United Nations
          [120.9881, 14.5772], // Pedro Gil
          [120.9917, 14.5703], // Quirino
          [120.9944, 14.5636], // Vito Cruz
          [120.9972, 14.5542], // Gil Puyat (Buendia)
          [120.9983, 14.5478], // Libertad
          [121.0006, 14.5375], // EDSA
          [120.9981, 14.5342]  // Baclaran
        ]
      },
      properties: {
        feature_type: 'transit_line',
        line_id: 'LRT-1',
        name: 'Light Rail Transit Line 1 (Green Line)',
        short_name: 'LRT-1',
        mode: 'rail',
        color: '#F47920',
        total_stations: 20,
        terminus_north: 'Fernando Poe Jr.',
        terminus_south: 'Baclaran',
        fare_type: 'lrt1',
        base_fare_php: 15.0,
        rate_per_km: 1.21,
        operating_hours: '04:30 - 22:00'
      }
    },
    {
      type: 'Feature',
      id: 'line-lrt2',
      geometry: {
        type: 'LineString',
        coordinates: [
          [120.9833, 14.6036], // Recto
          [120.9922, 14.6006], // Legarda
          [121.0053, 14.6017], // Pureza
          [121.0169, 14.6042], // V. Mapa
          [121.0261, 14.6106], // J. Ruiz
          [121.0342, 14.6136], // Gilmore
          [121.0428, 14.6186], // Betty Go-Belmonte
          [121.0531, 14.6225], // Araneta Center-Cubao
          [121.0644, 14.6281], // Anonas
          [121.0728, 14.6319], // Katipunan
          [121.0858, 14.6222], // Santolan
          [121.1006, 14.6247], // Marikina-Pasig
          [121.1219, 14.6253]  // Antipolo
        ]
      },
      properties: {
        feature_type: 'transit_line',
        line_id: 'LRT-2',
        name: 'Light Rail Transit Line 2 (Blue Line)',
        short_name: 'LRT-2',
        mode: 'rail',
        color: '#6F2C91',
        total_stations: 13,
        terminus_west: 'Recto',
        terminus_east: 'Antipolo',
        fare_type: 'lrt2',
        base_fare_php: 15.0,
        rate_per_km: 1.21,
        operating_hours: '05:00 - 21:30'
      }
    },
    {
      type: 'Feature',
      id: 'line-edsa-busway',
      geometry: {
        type: 'LineString',
        coordinates: [
          [120.9839, 14.6542], // Monumento
          [121.0014, 14.6575], // Balintawak
          [121.0211, 14.6575], // Roosevelt
          [121.0333, 14.6525], // North Avenue
          [121.0389, 14.6425], // Quezon Avenue
          [121.0436, 14.6347], // GMA-Kamuning
          [121.0528, 14.6194], // Main Avenue (Cubao)
          [121.0567, 14.6078], // Santolan
          [121.0583, 14.5878], // Ortigas
          [121.0411, 14.5672], // Guadalupe
          [121.0319, 14.5542], // Buendia
          [121.0281, 14.5492], // Ayala
          [121.0006, 14.5375], // Tramo / Taft
          [120.9911, 14.5167]  // PITX
        ]
      },
      properties: {
        feature_type: 'transit_line',
        line_id: 'BUS-EDSA-CAROUSEL',
        name: 'EDSA Carousel Busway',
        short_name: 'EDSA Carousel',
        mode: 'bus',
        color: '#FDB913',
        total_stations: 18,
        terminus_north: 'Monumento',
        terminus_south: 'PITX (Parañaque Integrated Terminal Exchange)',
        fare_type: 'bus_aircon',
        base_fare_php: 15.0,
        rate_per_km: 2.65,
        operating_hours: '24/7'
      }
    },
    {
      type: 'Feature',
      id: 'line-quezon-ave-corridor',
      geometry: {
        type: 'LineString',
        coordinates: [
          [121.0772, 14.6983], // Fairview Center Mall
          [121.0631, 14.6739], // Commonwealth Ave
          [121.0531, 14.6536], // Philcoa
          [121.0475, 14.6508], // Quezon Memorial Circle
          [121.0389, 14.6425], // Quezon Ave MRT
          [121.0189, 14.6292], // Fisher Mall / Roosevelt
          [121.0056, 14.6186], // Welcome Rotonda
          [120.9897, 14.6067], // España Blvd (UST)
          [120.9825, 14.5986], // Quiapo
          [120.9814, 14.5928]  // Manila City Hall
        ]
      },
      properties: {
        feature_type: 'transit_corridor',
        line_id: 'CORRIDOR-QUEZON-ESPANA',
        name: 'Fairview - Commonwealth - Quezon Ave - Quiapo Trunk Corridor',
        short_name: 'Quezon Ave Trunk',
        mode: 'jeepney',
        color: '#28A745',
        fare_type: 'traditional_jeepney',
        base_fare_php: 13.0,
        rate_per_km: 1.8,
        operating_hours: '05:00 - 23:00'
      }
    },
    {
      type: 'Feature',
      id: 'line-shaw-corridor',
      geometry: {
        type: 'LineString',
        coordinates: [
          [121.0536, 14.5811], // EDSA Shaw MRT-3
          [121.0603, 14.5817], // Sheridan / Pioneer
          [121.0664, 14.5819], // Kapitolyo / Pioneer
          [121.0758, 14.5772], // Rotonda Pasig
          [121.0822, 14.5606]  // Pasig Palengke / San Joaquin
        ]
      },
      properties: {
        feature_type: 'transit_corridor',
        line_id: 'CORRIDOR-SHAW-PASIG',
        name: 'EDSA Shaw - Pasig Palengke PUJ Corridor',
        short_name: 'Shaw-Pasig PUJ',
        mode: 'jeepney',
        color: '#17A2B8',
        fare_type: 'traditional_jeepney',
        base_fare_php: 13.0,
        rate_per_km: 1.8,
        operating_hours: '05:00 - 23:30'
      }
    },

    // -------------------------------------------------------------
    // TRANSIT STATIONS / NODES (Points)
    // -------------------------------------------------------------
    // Major Interchanges & Hubs
    {
      type: 'Feature',
      id: 'station-cubao-mrt3',
      geometry: {
        type: 'Point',
        coordinates: [121.0528, 14.6194]
      },
      properties: {
        feature_type: 'station',
        station_id: 'STN-MRT3-CUBAO',
        name: 'Araneta Center-Cubao (MRT-3)',
        lines: ['MRT-3'],
        city: 'Quezon City',
        is_transfer_station: true,
        transfer_connections: ['LRT-2 Araneta Center-Cubao', 'EDSA Carousel Main Ave'],
        amenities: { has_elevators: true, has_fare_gates: true, has_restrooms: true }
      }
    },
    {
      type: 'Feature',
      id: 'station-cubao-lrt2',
      geometry: {
        type: 'Point',
        coordinates: [121.0531, 14.6225]
      },
      properties: {
        feature_type: 'station',
        station_id: 'STN-LRT2-CUBAO',
        name: 'Araneta Center-Cubao (LRT-2)',
        lines: ['LRT-2'],
        city: 'Quezon City',
        is_transfer_station: true,
        transfer_connections: ['MRT-3 Araneta Center-Cubao'],
        amenities: { has_elevators: true, has_fare_gates: true, has_restrooms: true }
      }
    },
    {
      type: 'Feature',
      id: 'station-edsa-taft',
      geometry: {
        type: 'Point',
        coordinates: [121.0006, 14.5375]
      },
      properties: {
        feature_type: 'station',
        station_id: 'STN-INTERCHANGE-TAFT',
        name: 'Taft Avenue / EDSA Interchange',
        lines: ['MRT-3', 'LRT-1', 'BUS-EDSA-CAROUSEL'],
        city: 'Pasay',
        is_transfer_station: true,
        transfer_connections: ['MRT-3 Taft Ave', 'LRT-1 EDSA', 'EDSA Carousel Tramo'],
        amenities: { has_elevators: true, has_fare_gates: true, has_restrooms: true }
      }
    },
    {
      type: 'Feature',
      id: 'station-doroteo-recto',
      geometry: {
        type: 'Point',
        coordinates: [120.9828, 14.6045]
      },
      properties: {
        feature_type: 'station',
        station_id: 'STN-INTERCHANGE-RECTO-DJOSE',
        name: 'Doroteo Jose / Recto Interchange',
        lines: ['LRT-1', 'LRT-2'],
        city: 'Manila',
        is_transfer_station: true,
        transfer_connections: ['LRT-1 Doroteo Jose', 'LRT-2 Recto'],
        amenities: { has_elevators: false, has_fare_gates: true, has_restrooms: true }
      }
    },
    {
      type: 'Feature',
      id: 'station-mrt3-shaw',
      geometry: {
        type: 'Point',
        coordinates: [121.0536, 14.5811]
      },
      properties: {
        feature_type: 'station',
        station_id: 'STN-MRT3-SHAW',
        name: 'Shaw Boulevard (MRT-3)',
        lines: ['MRT-3'],
        city: 'Mandaluyong',
        is_transfer_station: true,
        transfer_connections: ['EDSA Shaw Jeepney Terminal', 'Pasig PUJ Lines'],
        amenities: { has_elevators: true, has_fare_gates: true, has_restrooms: true }
      }
    },
    {
      type: 'Feature',
      id: 'station-mrt3-ortigas',
      geometry: {
        type: 'Point',
        coordinates: [121.0583, 14.5878]
      },
      properties: {
        feature_type: 'station',
        station_id: 'STN-MRT3-ORTIGAS',
        name: 'Ortigas (MRT-3)',
        lines: ['MRT-3', 'BUS-EDSA-CAROUSEL'],
        city: 'Mandaluyong',
        is_transfer_station: true,
        transfer_connections: ['EDSA Carousel Ortigas', 'Ortigas Ave Buses & UV Express'],
        amenities: { has_elevators: false, has_fare_gates: true, has_restrooms: true }
      }
    },
    {
      type: 'Feature',
      id: 'station-mrt3-ayala',
      geometry: {
        type: 'Point',
        coordinates: [121.0281, 14.5492]
      },
      properties: {
        feature_type: 'station',
        station_id: 'STN-MRT3-AYALA',
        name: 'Ayala (MRT-3)',
        lines: ['MRT-3', 'BUS-EDSA-CAROUSEL'],
        city: 'Makati',
        is_transfer_station: true,
        transfer_connections: ['EDSA Carousel Ayala', 'One Ayala Intermodal Terminal', 'BGC Bus Terminal'],
        amenities: { has_elevators: true, has_fare_gates: true, has_restrooms: true }
      }
    },
    {
      type: 'Feature',
      id: 'station-mrt3-north-ave',
      geometry: {
        type: 'Point',
        coordinates: [121.0333, 14.6525]
      },
      properties: {
        feature_type: 'station',
        station_id: 'STN-MRT3-NORTH',
        name: 'North Avenue (MRT-3)',
        lines: ['MRT-3', 'BUS-EDSA-CAROUSEL'],
        city: 'Quezon City',
        is_transfer_station: true,
        transfer_connections: ['EDSA Carousel North Ave', 'Trinoma PUV Terminal'],
        amenities: { has_elevators: true, has_fare_gates: true, has_restrooms: true }
      }
    },
    {
      type: 'Feature',
      id: 'station-lrt1-central',
      geometry: {
        type: 'Point',
        coordinates: [120.9814, 14.5928]
      },
      properties: {
        feature_type: 'station',
        station_id: 'STN-LRT1-CENTRAL',
        name: 'Central Terminal (LRT-1)',
        lines: ['LRT-1'],
        city: 'Manila',
        is_transfer_station: true,
        transfer_connections: ['Lawton PUV Terminal', 'Pasig River Ferry Lawton Station'],
        amenities: { has_elevators: false, has_fare_gates: true, has_restrooms: true }
      }
    },
    {
      type: 'Feature',
      id: 'station-lrt1-un',
      geometry: {
        type: 'Point',
        coordinates: [120.9836, 14.5828]
      },
      properties: {
        feature_type: 'station',
        station_id: 'STN-LRT1-UN',
        name: 'United Nations (LRT-1)',
        lines: ['LRT-1'],
        city: 'Manila',
        is_transfer_station: false,
        transfer_connections: ['Taft Ave Jeepneys', 'Kalaw Ave Public Library Access'],
        amenities: { has_elevators: false, has_fare_gates: true, has_restrooms: false }
      }
    },
    {
      type: 'Feature',
      id: 'station-lrt2-katipunan',
      geometry: {
        type: 'Point',
        coordinates: [121.0728, 14.6319]
      },
      properties: {
        feature_type: 'station',
        station_id: 'STN-LRT2-KATIPUNAN',
        name: 'Katipunan (LRT-2)',
        lines: ['LRT-2'],
        city: 'Quezon City',
        is_transfer_station: false,
        transfer_connections: ['Katipunan Ave Jeepneys', 'Ateneo / Miriam / UP Diliman Transit'],
        amenities: { has_elevators: true, has_fare_gates: true, has_restrooms: true }
      }
    }
  ]
};

/**
 * Standard Edge Caching Headers for Static Transit Network
 * Enforces A-M2-01 & A-M3-03:
 * Cache-Control: public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800
 */
export const TRANSIT_CACHE_HEADERS = {
  'Content-Type': 'application/geo+json; charset=utf-8',
  'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
  ETag: '"lunhaw-transit-v1-20261101"',
  'X-Content-Type-Options': 'nosniff'
} as const;

/**
 * GET /transit/network (A-M2-01, F-003, INV-003)
 * Serves the static GeoJSON transit graph (MRT/LRT lines, stations, busways)
 * with aggressive edge caching headers for client-side routing offload.
 */
transitRoute.get('/network', (c) => {
  // If-None-Match ETag check for 304 Not Modified
  const clientEtag = c.req.header('if-none-match');
  if (clientEtag === TRANSIT_CACHE_HEADERS.ETag) {
    return c.body(null, 304, TRANSIT_CACHE_HEADERS);
  }

  return c.json(TRANSIT_NETWORK_GEOJSON, 200, TRANSIT_CACHE_HEADERS);
});

/**
 * GET /transit (convenience alias for network)
 */
transitRoute.get('/', (c) => {
  return c.json(TRANSIT_NETWORK_GEOJSON, 200, TRANSIT_CACHE_HEADERS);
});

/**
 * GET /transit/lines - returns transit lines subset
 */
transitRoute.get('/lines', (c) => {
  const lineFeatures = TRANSIT_NETWORK_GEOJSON.features.filter(
    (f) => f.geometry.type === 'LineString'
  );
  return c.json(
    {
      type: 'FeatureCollection',
      properties: { count: lineFeatures.length },
      features: lineFeatures
    },
    200,
    TRANSIT_CACHE_HEADERS
  );
});

/**
 * GET /transit/stations - returns transit station nodes subset
 */
transitRoute.get('/stations', (c) => {
  const stationFeatures = TRANSIT_NETWORK_GEOJSON.features.filter(
    (f) => f.geometry.type === 'Point'
  );
  return c.json(
    {
      type: 'FeatureCollection',
      properties: { count: stationFeatures.length },
      features: stationFeatures
    },
    200,
    TRANSIT_CACHE_HEADERS
  );
});
