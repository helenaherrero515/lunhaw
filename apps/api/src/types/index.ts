/**
 * Core Domain & API Types for Lunhaw API Gateway
 * Strict adherence to RFC 7807 (Problem Details) and RFC 7946 (GeoJSON)
 */

export type VerificationStatus = 'VERIFIED' | 'ESTIMATE' | 'NOT_AVAILABLE';

export interface VerificationMeta {
  status: VerificationStatus;
  official_source?: string | null;
  source_url?: string | null;
  last_verified_at?: string | null;
  derivation_note?: string | null;
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
}

export interface Env {
  ENVIRONMENT?: string;
  CORS_ORIGIN?: string;
  RATE_LIMIT_PER_MINUTE?: string;
}
