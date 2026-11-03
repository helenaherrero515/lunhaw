/**
 * Routing domain and contract types for Lunhaw Commute & Shade Navigation
 * Enforces PRD (F-003, F-004), api-spec.md (API-003), and methods.md (EQ-001, EQ-002, EQ-003, EQ-004)
 */

import type { VerificationMeta, Coordinates } from "./places";

export type { Coordinates, VerificationMeta };

export type RoutePreference =
  | "fastest"
  | "shaded_walk"
  | "least_walking"
  | "transit_only";

export type RouteLegMode =
  | "walk"
  | "jeepney"
  | "bus"
  | "rail"
  | "transfer"
  | "board"
  | "alight";

export interface GeoJSONLineString {
  type: "LineString";
  coordinates: [number, number][]; // [longitude, latitude]
}

export interface FareMeta {
  amount_php: number;
  currency?: string;
  verification: VerificationMeta;
}

export interface RouteLeg {
  id: string;
  sequence: number;
  mode: RouteLegMode;
  instruction: string;
  distance_m: number;
  duration_seconds: number;
  shade_coverage_pct: number;
  fare: FareMeta;
  transit_line?: string;
  from_name?: string;
  to_name?: string;
  path_geometry_geojson: GeoJSONLineString;
  verification: VerificationMeta;
}

export interface RouteOption {
  route_id: string;
  title: string;
  total_distance_m: number;
  est_duration_seconds: number;
  average_shade_score: number;
  preference_tag?: RoutePreference;
  fare: FareMeta;
  geometry_geojson: GeoJSONLineString;
  legs: RouteLeg[];
  verification: VerificationMeta;
}

export interface RoutePlanRequest {
  origin: Coordinates;
  destination: Coordinates;
  preference?: RoutePreference;
}

export type RouteWorkerRequest =
  | {
      id: string;
      type: "FIND_ROUTE";
      payload: RoutePlanRequest;
    }
  | {
      id: string;
      type: "INIT_GRAPH";
      payload?: {
        nodes?: Array<{ id: string; lat: number; lng: number; shadeScore?: number }>;
      };
    };

export type RouteWorkerResponse =
  | {
      id: string;
      type: "ROUTE_RESULT";
      payload: {
        routes: RouteOption[];
        calculation_time_ms: number;
      };
    }
  | {
      id: string;
      type: "ROUTE_ERROR";
      payload: {
        error: string;
        calculation_time_ms?: number;
      };
    };
