import { Hono } from 'hono';
import type { Env, ProblemDetails } from '../types/index.js';
import { NCR_BOUNDS } from './places.js';

export const commuteRoute = new Hono<{ Bindings: Env }>();

interface RouteRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  preference?: 'shaded_walk' | 'fastest' | 'least_walking' | 'transit_only';
}

commuteRoute.post('/routes', async (c) => {
  let body: RouteRequest;
  try {
    body = await c.req.json<RouteRequest>();
  } catch {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_MALFORMED_JSON',
      title: 'Malformed JSON Payload',
      status: 400,
      detail: 'The request body could not be parsed as valid JSON.',
      instance: c.req.path,
      code: 'ERR_MALFORMED_JSON'
    };
    return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
  }

  const { origin, destination, preference = 'shaded_walk' } = body;

  if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_INVALID_COORDINATES',
      title: 'Missing Coordinates',
      status: 400,
      detail: 'Both origin and destination with valid lat and lng are required.',
      instance: c.req.path,
      code: 'ERR_INVALID_COORDINATES'
    };
    return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
  }

  // Validate coordinates lie within NCR bounds
  const isOriginValid =
    origin.lat >= NCR_BOUNDS.MIN_LAT &&
    origin.lat <= NCR_BOUNDS.MAX_LAT &&
    origin.lng >= NCR_BOUNDS.MIN_LNG &&
    origin.lng <= NCR_BOUNDS.MAX_LNG;

  const isDestValid =
    destination.lat >= NCR_BOUNDS.MIN_LAT &&
    destination.lat <= NCR_BOUNDS.MAX_LAT &&
    destination.lng >= NCR_BOUNDS.MIN_LNG &&
    destination.lng <= NCR_BOUNDS.MAX_LNG;

  if (!isOriginValid || !isDestValid) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_INVALID_COORDINATES',
      title: 'Coordinates Out of Bounds',
      status: 400,
      detail: `Coordinates lie outside the valid NCR bounding box (${NCR_BOUNDS.MIN_LAT}°N–${NCR_BOUNDS.MAX_LAT}°N, ${NCR_BOUNDS.MIN_LNG}°E–${NCR_BOUNDS.MAX_LNG}°E).`,
      instance: c.req.path,
      code: 'ERR_INVALID_COORDINATES'
    };
    return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
  }

  // Sample calculated route adhering to openapi spec
  return c.json({
    status: 'success',
    data: {
      routes: [
        {
          route_id: 'r-001',
          title: preference === 'shaded_walk' ? 'Shaded Walk via Tree Canopy' : 'Direct Walking Route',
          total_distance_m: 850,
          est_duration_seconds: 720,
          average_shade_score: 78.4,
          fare: {
            amount_php: 0.0,
            verification: {
              status: 'VERIFIED',
              official_source: 'Pedestrian Walking Route',
              last_verified_at: '2026-11-01T00:00:00Z'
            }
          },
          geometry_geojson: {
            type: 'LineString',
            coordinates: [
              [origin.lng, origin.lat],
              [(origin.lng + destination.lng) / 2, (origin.lat + destination.lat) / 2],
              [destination.lng, destination.lat]
            ]
          },
          legs: [
            {
              sequence: 1,
              mode: 'walk',
              instruction: 'Walk along shaded sidewalk under tree canopy',
              distance_m: 850,
              duration_seconds: 720,
              shade_coverage_pct: 78.4,
              fare: {
                amount_php: 0.0,
                verification: {
                  status: 'VERIFIED',
                  official_source: 'Free Pedestrian Walkway'
                }
              },
              path_geometry_geojson: {
                type: 'LineString',
                coordinates: [
                  [origin.lng, origin.lat],
                  [destination.lng, destination.lat]
                ]
              },
              verification: {
                status: 'ESTIMATE',
                derivation_note: 'Canopy calculated from Sentinel-2 NDVI overlay via EQ-002'
              }
            }
          ]
        }
      ]
    }
  });
});
