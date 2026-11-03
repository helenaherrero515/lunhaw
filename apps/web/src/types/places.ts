/**
 * Domain & Component Types for Lunhaw Places, Libraries, & Reading Centers
 * Conforms to prd.md (F-001, F-002, INV-001, INV-002) and api-spec.md
 */

import type { VerificationStatus } from "@lunhaw/ui";

export type { VerificationStatus };

export interface VerificationMeta {
  status: VerificationStatus;
  official_source?: string | null;
  official_source_name?: string | null;
  source_url?: string | null;
  official_source_url?: string | null;
  last_verified_at?: string | Date | null;
  derivation_note?: string | null;
  verified_by?: string | null;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export type PlaceCategory =
  | "park"
  | "garden"
  | "library"
  | "reading_center"
  | "civic_space";

export interface StudyAmenities {
  desk_capacity?: number | null;
  has_power_outlets: boolean;
  has_wifi: boolean;
  has_aircon: boolean;
  has_quiet_zone?: boolean;
  is_free_to_use?: boolean;
  verification?: VerificationMeta;
  amenity_verifications?: Partial<
    Record<
      | "desk_capacity"
      | "has_power_outlets"
      | "has_wifi"
      | "has_aircon"
      | "has_quiet_zone"
      | "is_free_to_use",
      VerificationMeta
    >
  >;
}

export interface OperatingHours {
  id?: string;
  place_id?: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  day_name: string;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  schedule_label?: string;
  verification: VerificationMeta;
}

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  city: string;
  lgu_city?: string;
  barangay: string;
  address: string;
  coordinates: Coordinates;
  green_index_score?: number | null;
  verification: VerificationMeta;
  study_amenities?: StudyAmenities;
  schedules?: OperatingHours[];
  operating_hours?: OperatingHours[];
  description?: string | null;
  access_requirements?: string | null;
  fee_description?: string | null;
  disclaimer?: string;
  is_barangay_reading_center?: boolean;
  desk_capacity?: number | null;
}

export interface FacilityDetail extends Place {
  is_barangay_reading_center?: boolean;
  desk_capacity?: number | null;
  has_power_outlets?: boolean;
  has_wifi?: boolean;
  has_aircon?: boolean;
  access_requirements?: string | null;
  fee_description?: string | null;
}

export interface LGUArea {
  city_name: string;
  total_barangays: number;
  barangays: string[];
  coordinates?: Coordinates;
}

export interface LocationFilter {
  city?: string;
  barangay?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
}
