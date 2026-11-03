"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Bookmark,
  BookmarkCheck,
  Clock,
  Wifi,
  Zap,
  BookOpen,
  Wind,
  ShieldCheck,
  AlertCircle,
  X,
  Volume2,
  TreePine,
  Sparkles,
  Info,
} from "lucide-react";
import {
  VerificationBadge,
  FacilityDisclaimerBanner,
  type VerificationStatus,
} from "@lunhaw/ui";
import type { Place, FacilityDetail, OperatingHours, VerificationMeta } from "@/types/places";
import { GreenIndexPill } from "@/components/green-index/GreenIndexPill";

export interface FacilityProfileProps {
  facility: Place | FacilityDetail;
  isSaved?: boolean;
  onToggleSave?: (facilityId: string, isSaved: boolean) => void;
  onGetDirections?: (facility: Place | FacilityDetail) => void;
  onClose?: () => void;
  className?: string;
  showCloseButton?: boolean;
}

const STORAGE_SAVED_KEY = "lunhaw_saved_places";

const DAYS_OF_WEEK_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return "";
  // Check if already in 12hr format like "8:00 AM"
  if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;

  const parts = timeStr.split(":");
  const hourPart = parts[0];
  const minutePart = parts[1];
  if (!hourPart || !minutePart) return timeStr;

  const hours = parseInt(hourPart, 10);
  const minutes = minutePart;
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;

  return `${formattedHours}:${minutes} ${ampm}`;
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "reading_center":
      return "Barangay Reading Center";
    case "library":
      return "Public Library";
    case "park":
      return "Public Park";
    case "garden":
      return "Community Garden";
    case "civic_space":
      return "Civic Space";
    default:
      return category.replace("_", " ");
  }
}

export function FacilityProfile({
  facility,
  isSaved: controlledIsSaved,
  onToggleSave,
  onGetDirections,
  onClose,
  className = "",
  showCloseButton = true,
}: FacilityProfileProps) {
  const [internalSaved, setInternalSaved] = useState<boolean>(() => {
    if (typeof controlledIsSaved === "boolean") return controlledIsSaved;
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem(STORAGE_SAVED_KEY);
      if (!stored) return false;
      const ids: string[] = JSON.parse(stored);
      return ids.includes(facility.id);
    } catch {
      return false;
    }
  });

  const isSaved =
    typeof controlledIsSaved === "boolean" ? controlledIsSaved : internalSaved;

  useEffect(() => {
    if (typeof controlledIsSaved === "boolean") {
      setInternalSaved(controlledIsSaved);
    }
  }, [controlledIsSaved]);

  const handleToggleSave = () => {
    const nextSaved = !isSaved;
    setInternalSaved(nextSaved);

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_SAVED_KEY);
        let ids: string[] = stored ? JSON.parse(stored) : [];
        if (nextSaved) {
          if (!ids.includes(facility.id)) ids.push(facility.id);
        } else {
          ids = ids.filter((id) => id !== facility.id);
        }
        localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(ids));
      } catch {
        // LocalStorage access error
      }
    }

    onToggleSave?.(facility.id, nextSaved);
  };

  const amenities = facility.study_amenities;
  const overallVerification = facility.verification;
  const schedules: OperatingHours[] =
    facility.schedules || facility.operating_hours || [];

  // Helper to determine verification metadata for specific amenity
  const getAmenityVerification = (
    amenityKey:
      | "desk_capacity"
      | "has_power_outlets"
      | "has_wifi"
      | "has_aircon"
      | "has_quiet_zone"
      | "is_free_to_use",
    hasExplicitValue: boolean
  ): VerificationMeta => {
    if (amenities?.amenity_verifications?.[amenityKey]) {
      return amenities.amenity_verifications[amenityKey]!;
    }
    if (!hasExplicitValue) {
      return { status: "NOT_AVAILABLE" };
    }
    if (amenities?.verification) {
      return amenities.verification;
    }
    return overallVerification || { status: "ESTIMATE" };
  };

  return (
    <article
      className={`relative flex flex-col overflow-y-auto rounded-2xl border border-stone-200/90 bg-[#FDFBF7] p-5 shadow-lg md:p-7 ${className}`}
      aria-label={`Facility details for ${facility.name}`}
    >
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-800">
            {facility.category === "park" || facility.category === "garden" ? (
              <TreePine className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {getCategoryLabel(facility.category)}
          </span>

          {facility.green_index_score != null && (
            <GreenIndexPill
              score={facility.green_index_score}
              size="sm"
              placeName={facility.name}
              verification={facility.verification}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Save Button (TC-005 / F-005) */}
          <button
            type="button"
            role="button"
            onClick={handleToggleSave}
            aria-label={isSaved ? "Remove from saved places" : "Save facility"}
            aria-pressed={isSaved}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all ${
              isSaved
                ? "border-emerald-700 bg-emerald-700 text-white shadow-sm hover:bg-emerald-800"
                : "border-stone-300 bg-white text-stone-700 hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-900"
            }`}
          >
            {isSaved ? (
              <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Bookmark className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{isSaved ? "Saved" : "Save"}</span>
          </button>

          {onGetDirections && (
            <button
              type="button"
              onClick={() => onGetDirections(facility)}
              aria-label={`Get commute directions to ${facility.name}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-700 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-900 transition-all hover:bg-emerald-100"
            >
              <Sparkles className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <span>Directions</span>
            </button>
          )}

          {showCloseButton && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close facility details"
              className="rounded-xl border border-stone-200 bg-white p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Facility Header */}
      <header className="mt-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900 md:text-2xl">
              {facility.name}
            </h1>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-stone-600">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
              <span>
                {facility.address || `${facility.barangay}, ${facility.city}`}
              </span>
            </div>
          </div>

          {/* Overall Integrity Badge (INV-001) */}
          <div className="mt-1 shrink-0 md:mt-0">
            <VerificationBadge
              status={overallVerification?.status ?? "NOT_AVAILABLE"}
              sourceName={
                overallVerification?.official_source_name ||
                overallVerification?.official_source
              }
              lastVerifiedAt={overallVerification?.last_verified_at}
              derivationNote={overallVerification?.derivation_note}
            />
          </div>
        </div>
      </header>

      {/* Mandatory Advisory Disclaimer Banner (INV-002 / TC-N02) */}
      <section className="mt-5" aria-label="Facility advisory notice">
        <FacilityDisclaimerBanner facilityName={facility.name} />
      </section>

      {/* Description */}
      {facility.description && (
        <p className="mt-4 text-xs leading-relaxed text-stone-700">
          {facility.description}
        </p>
      )}

      {/* Study & Facility Amenities (F-002 / TC-002 / INV-001) */}
      <section className="mt-6" aria-labelledby="amenities-heading">
        <div className="flex items-center justify-between border-b border-stone-200/70 pb-2">
          <h2
            id="amenities-heading"
            className="text-sm font-bold uppercase tracking-wider text-emerald-950"
          >
            Study & Facility Amenities
          </h2>
          <span className="text-[11px] font-medium text-stone-500">
            Data Honesty Guarantee (INV-001)
          </span>
        </div>

        <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {/* Desk Capacity */}
          {(() => {
            const deskCount =
              amenities?.desk_capacity ?? facility.desk_capacity;
            const hasDesks = deskCount != null && deskCount > 0;
            const v = getAmenityVerification("desk_capacity", deskCount != null);
            return (
              <div
                className="flex items-center justify-between rounded-xl border border-stone-200/90 bg-white p-3 shadow-2xs"
                data-testid="amenity-desk-capacity"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-900">
                      Study Desks
                    </p>
                    <p className="text-[11px] text-stone-600">
                      {deskCount != null
                        ? `${deskCount} Desks Available`
                        : "Not available yet"}
                    </p>
                  </div>
                </div>
                <VerificationBadge
                  status={v.status}
                  sourceName={v.official_source_name || v.official_source}
                  lastVerifiedAt={v.last_verified_at}
                  derivationNote={v.derivation_note}
                />
              </div>
            );
          })()}

          {/* Power Outlets */}
          {(() => {
            const hasPower = amenities?.has_power_outlets ?? false;
            const isKnown = amenities?.has_power_outlets !== undefined;
            const v = getAmenityVerification("has_power_outlets", isKnown);
            return (
              <div
                className="flex items-center justify-between rounded-xl border border-stone-200/90 bg-white p-3 shadow-2xs"
                data-testid="amenity-power"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
                    <Zap className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-900">
                      Power Outlets
                    </p>
                    <p className="text-[11px] text-stone-600">
                      {isKnown
                        ? hasPower
                          ? "Available for Laptops"
                          : "No Outlets"
                        : "Not available yet"}
                    </p>
                  </div>
                </div>
                <VerificationBadge
                  status={v.status}
                  sourceName={v.official_source_name || v.official_source}
                  lastVerifiedAt={v.last_verified_at}
                  derivationNote={v.derivation_note}
                />
              </div>
            );
          })()}

          {/* Wi-Fi */}
          {(() => {
            const hasWifi = amenities?.has_wifi ?? false;
            const isKnown = amenities?.has_wifi !== undefined;
            const v = getAmenityVerification("has_wifi", isKnown);
            return (
              <div
                className="flex items-center justify-between rounded-xl border border-stone-200/90 bg-white p-3 shadow-2xs"
                data-testid="amenity-wifi"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
                    <Wifi className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-900">
                      Public Wi-Fi
                    </p>
                    <p className="text-[11px] text-stone-600">
                      {isKnown
                        ? hasWifi
                          ? "Free Public Wi-Fi"
                          : "No Wi-Fi"
                        : "Not available yet"}
                    </p>
                  </div>
                </div>
                <VerificationBadge
                  status={v.status}
                  sourceName={v.official_source_name || v.official_source}
                  lastVerifiedAt={v.last_verified_at}
                  derivationNote={v.derivation_note}
                />
              </div>
            );
          })()}

          {/* Air Conditioning */}
          {(() => {
            const hasAircon = amenities?.has_aircon ?? false;
            const isKnown = amenities?.has_aircon !== undefined;
            const v = getAmenityVerification("has_aircon", isKnown);
            return (
              <div
                className="flex items-center justify-between rounded-xl border border-stone-200/90 bg-white p-3 shadow-2xs"
                data-testid="amenity-aircon"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-800">
                    <Wind className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-900">
                      Air Conditioning
                    </p>
                    <p className="text-[11px] text-stone-600">
                      {isKnown
                        ? hasAircon
                          ? "Air-conditioned Room"
                          : "Natural Ventilation"
                        : "Not available yet"}
                    </p>
                  </div>
                </div>
                <VerificationBadge
                  status={v.status}
                  sourceName={v.official_source_name || v.official_source}
                  lastVerifiedAt={v.last_verified_at}
                  derivationNote={v.derivation_note}
                />
              </div>
            );
          })()}

          {/* Quiet Zone */}
          {amenities?.has_quiet_zone !== undefined && (
            <div className="flex items-center justify-between rounded-xl border border-stone-200/90 bg-white p-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-800">
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-900">
                    Quiet Study Zone
                  </p>
                  <p className="text-[11px] text-stone-600">
                    {amenities.has_quiet_zone
                      ? "Dedicated Quiet Area"
                      : "Open Discussion Allowed"}
                  </p>
                </div>
              </div>
              <VerificationBadge
                status={getAmenityVerification("has_quiet_zone", true).status}
              />
            </div>
          )}

          {/* Fee / Admission */}
          {(facility.fee_description || amenities?.is_free_to_use !== undefined) && (
            <div className="flex items-center justify-between rounded-xl border border-stone-200/90 bg-white p-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-900">
                    Admission
                  </p>
                  <p className="text-[11px] text-stone-600">
                    {facility.fee_description ||
                      (amenities?.is_free_to_use
                        ? "Free Admission"
                        : "Nominal fee may apply")}
                  </p>
                </div>
              </div>
              <VerificationBadge
                status={getAmenityVerification("is_free_to_use", true).status}
              />
            </div>
          )}
        </div>
      </section>

      {/* Operating Hours Schedule Grid (TC-002 / INV-001) */}
      <section className="mt-7" aria-labelledby="hours-heading">
        <div className="flex items-center justify-between border-b border-stone-200/70 pb-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-800" aria-hidden="true" />
            <h2
              id="hours-heading"
              className="text-sm font-bold uppercase tracking-wider text-emerald-950"
            >
              Operating Hours & Schedule
            </h2>
          </div>
          <span className="text-[11px] font-medium text-stone-500">
            7-Day Schedule
          </span>
        </div>

        {schedules.length === 0 ? (
          <div className="mt-3.5 flex items-center justify-between rounded-xl border border-dashed border-stone-300 bg-stone-50/70 p-3.5 text-xs text-stone-600">
            <span>Operating hours not available yet for this facility.</span>
            <VerificationBadge status="NOT_AVAILABLE" />
          </div>
        ) : (
          <div className="mt-3.5 overflow-hidden rounded-xl border border-stone-200/90 bg-white shadow-2xs">
            <table
              className="w-full text-left text-xs"
              aria-label="Operating hours weekly schedule"
            >
              <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-600 border-b border-stone-200/80">
                <tr>
                  <th scope="col" className="px-3.5 py-2.5">
                    Day
                  </th>
                  <th scope="col" className="px-3.5 py-2.5">
                    Hours
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {schedules.map((schedule, idx) => {
                  const dayName = schedule.day_name;
                  const isClosed = schedule.is_closed;
                  const formattedHours = isClosed
                    ? "Closed"
                    : schedule.open_time && schedule.close_time
                    ? `${formatTime(schedule.open_time)} – ${formatTime(
                        schedule.close_time
                      )}`
                    : "Hours unlisted";

                  const scheduleStatus =
                    schedule.verification?.status ??
                    overallVerification?.status ??
                    "ESTIMATE";

                  return (
                    <tr
                      key={`${dayName}-${idx}`}
                      className="hover:bg-stone-50/60 transition-colors"
                    >
                      <th
                        scope="row"
                        className="px-3.5 py-2 font-medium text-stone-800"
                      >
                        {dayName}
                      </th>
                      <td className="px-3.5 py-2 text-stone-600">
                        {isClosed ? (
                          <span className="inline-flex rounded bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                            Closed
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-stone-800">
                            {formattedHours}
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2 text-right">
                        <VerificationBadge
                          status={scheduleStatus}
                          sourceName={
                            schedule.verification?.official_source_name ||
                            schedule.verification?.official_source
                          }
                          lastVerifiedAt={schedule.verification?.last_verified_at}
                          derivationNote={schedule.verification?.derivation_note}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Access Requirements & Guidelines */}
      {facility.access_requirements && (
        <section
          className="mt-6 rounded-xl border border-emerald-900/10 bg-emerald-50/50 p-4"
          aria-labelledby="rules-heading"
        >
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" aria-hidden="true" />
            <div>
              <h3
                id="rules-heading"
                className="text-xs font-bold uppercase tracking-wider text-emerald-950"
              >
                Access Requirements & Visitor Rules
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-emerald-900">
                {facility.access_requirements}
              </p>
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
