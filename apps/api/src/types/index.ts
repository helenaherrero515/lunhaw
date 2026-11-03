/**
 * Core Domain & API Types for Lunhaw API Gateway
 * Strict adherence to RFC 7807 (Problem Details) and RFC 7946 (GeoJSON)
 */

export type VerificationStatus = 'VERIFIED' | 'ESTIMATE' | 'NOT_AVAILABLE';

export interface VerificationMeta {
  status: VerificationStatus;
  official_source?: string | null;
  official_source_name?: string | null;
  source_url?: string | null;
  official_source_url?: string | null;
  last_verified_at?: string | null;
  derivation_note?: string | null;
  verified_by?: string | null;
}

export type GeoJSONPosition = [longitude: number, latitude: number, elevation?: number];

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: GeoJSONPosition;
}

export interface GeoJSONLineString {
  type: 'LineString';
  coordinates: GeoJSONPosition[];
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: GeoJSONPosition[][];
}

export type GeoJSONGeometry = GeoJSONPoint | GeoJSONLineString | GeoJSONPolygon;

export interface GeoJSONFeature<G = GeoJSONGeometry, P = Record<string, unknown>> {
  type: 'Feature';
  geometry: G;
  properties: P;
  id?: string | number;
}

export interface GeoJSONFeatureCollection<G = GeoJSONGeometry, P = Record<string, unknown>> {
  type: 'FeatureCollection';
  features: GeoJSONFeature<G, P>[];
  properties?: Record<string, unknown>;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: string;
  invalid_params?: Array<{ name: string; reason: string }>;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DaySchedule {
  day_of_week: number;
  day_name: string;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  verification: VerificationMeta;
}

export interface StudyAmenities {
  desk_capacity?: number | null;
  has_power_outlets: boolean;
  has_wifi: boolean;
  has_aircon: boolean;
  has_quiet_zone?: boolean;
  is_free_to_use?: boolean;
}

export type PlaceCategory = 'park' | 'garden' | 'library' | 'reading_center';

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  description?: string | null;
  city: string;
  barangay: string;
  address: string;
  coordinates: Coordinates;
  point_geojson?: GeoJSONPoint;
  boundary_geojson?: GeoJSONPolygon | null;
  green_index_score?: number | null;
  verification: VerificationMeta;
  study_amenities?: StudyAmenities;
  disclaimer?: string;
  schedules?: DaySchedule[];
  access_requirements?: string | null;
  distance_km?: number | null;
}

export type RoutePreference = 'shaded_walk' | 'fastest' | 'least_walking' | 'transit_only';

export type RouteLegMode =
  | 'walk'
  | 'jeepney'
  | 'bus'
  | 'rail'
  | 'lrt1'
  | 'lrt2'
  | 'mrt3'
  | 'pnr'
  | 'transfer';

export interface FareDetail {
  amount_php: number;
  currency?: string;
  verification: VerificationMeta;
}

export interface RouteLeg {
  sequence: number;
  mode: RouteLegMode;
  instruction: string;
  distance_m: number;
  duration_seconds: number;
  shade_coverage_pct?: number | null;
  fare?: FareDetail;
  transit_line?: string | null;
  from_name?: string | null;
  to_name?: string | null;
  path_geometry_geojson?: GeoJSONLineString;
  verification: VerificationMeta;
}

export interface CommuteRoute {
  route_id: string;
  title: string;
  total_distance_m: number;
  est_duration_seconds: number;
  average_shade_score: number;
  preference_tag?: RoutePreference;
  fare: FareDetail;
  geometry_geojson?: GeoJSONLineString;
  legs: RouteLeg[];
  verification?: VerificationMeta;
}

export interface GreenIndexBreakdown {
  canopy_component: number;
  ndvi_component: number;
  permeable_component: number;
}

export interface GreenIndexInputs {
  canopy_cover_pct: number;
  ndvi_density_scaled: number;
  permeable_surface_pct: number;
}

export interface GreenIndexResult {
  place_id: string;
  place_name?: string;
  total_score: number;
  breakdown: GreenIndexBreakdown;
  inputs: GreenIndexInputs;
  equation_id: 'EQ-001';
  input_dataset_ids: ['DS-001', 'DS-002'];
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  verification_status: VerificationStatus;
  derivation_note: string;
  measured_data_source?: string;
  calculated_at: string;
}

export interface Env {
  ENVIRONMENT?: string;
  CORS_ORIGIN?: string;
  RATE_LIMIT_PER_MINUTE?: string;
}
