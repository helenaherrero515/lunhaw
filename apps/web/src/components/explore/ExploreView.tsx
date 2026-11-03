"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Search,
  MapPin,
  Filter,
  Navigation,
  TreePine,
  BookOpen,
  ArrowLeft,
  X,
  Sparkles,
  ChevronRight,
  Compass,
} from "lucide-react";
import { Marker } from "maplibre-gl";
import type { Map as MapLibreMapInstance } from "maplibre-gl";
import { VerificationBadge } from "@lunhaw/ui";
import { MapLibreMap, DEFAULT_METRO_MANILA_CENTER } from "@/components/map/MapLibreMap";
import { FacilityProfile } from "@/components/places/FacilityProfile";
import { LGUSelectorModal } from "@/components/location/LGUSelectorModal";
import { useUserLocation } from "@/lib/hooks/useUserLocation";
import type { Place, PlaceCategory } from "@/types/places";
import { GreenIndexPill } from "@/components/green-index/GreenIndexPill";
import { RoutePlanner } from "@/components/routing/RoutePlanner";
import { RouteShadeLayer } from "@/components/map/RouteShadeLayer";
import type { RouteOption } from "@/types/routing";

export type CategoryFilter = "all" | "parks" | "libraries";
export interface ExploreViewProps {
  initialPlaces?: Place[];
  defaultSelectedPlaceId?: string;
  className?: string;
}

const DEFAULT_EXPLORE_PLACES: Place[] = [
  {
    id: "c1f7a0b3-6c7e-4d8a-9f5e-123456789abc",
    name: "Barangay San Antonio Reading Center",
    category: "reading_center",
    city: "Pasig",
    barangay: "San Antonio",
    address: "San Antonio Community Complex, Pasig",
    coordinates: { lat: 14.5823, lng: 121.0611 },
    green_index_score: 68.5,
    verification: {
      status: "VERIFIED",
      official_source: "Pasig LGU Public Affairs",
      source_url: "https://pasigcity.gov.ph/reading-centers",
      last_verified_at: "2026-09-15T08:00:00Z",
    },
    study_amenities: {
      desk_capacity: 25,
      has_power_outlets: true,
      has_wifi: true,
      has_aircon: true,
      has_quiet_zone: true,
      is_free_to_use: true,
      verification: {
        status: "VERIFIED",
        official_source: "Pasig LGU Public Affairs",
      },
    },
    access_requirements: "Valid student or government-issued ID required.",
    schedules: [
      {
        day_of_week: 1,
        day_name: "Monday",
        open_time: "08:00:00",
        close_time: "17:00:00",
        is_closed: false,
        verification: { status: "VERIFIED" },
      },
      {
        day_of_week: 2,
        day_name: "Tuesday",
        open_time: "08:00:00",
        close_time: "17:00:00",
        is_closed: false,
        verification: { status: "VERIFIED" },
      },
      {
        day_of_week: 3,
        day_name: "Wednesday",
        open_time: "08:00:00",
        close_time: "17:00:00",
        is_closed: false,
        verification: { status: "VERIFIED" },
      },
      {
        day_of_week: 4,
        day_name: "Thursday",
        open_time: "08:00:00",
        close_time: "17:00:00",
        is_closed: false,
        verification: { status: "VERIFIED" },
      },
      {
        day_of_week: 5,
        day_name: "Friday",
        open_time: "08:00:00",
        close_time: "17:00:00",
        is_closed: false,
        verification: { status: "VERIFIED" },
      },
      {
        day_of_week: 6,
        day_name: "Saturday",
        open_time: null,
        close_time: null,
        is_closed: true,
        verification: { status: "VERIFIED" },
      },
      {
        day_of_week: 0,
        day_name: "Sunday",
        open_time: null,
        close_time: null,
        is_closed: true,
        verification: { status: "VERIFIED" },
      },
    ],
  },
  {
    id: "a2b8c9d0-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
    name: "Quezon City Public Library - Main Branch",
    category: "library",
    city: "Quezon City",
    barangay: "Central",
    address: "City Hall Compound, Elliptical Road, Diliman, Quezon City",
    coordinates: { lat: 14.6465, lng: 121.0494 },
    green_index_score: 74.2,
    verification: {
      status: "VERIFIED",
      official_source: "QC Public Library Management",
      source_url: "https://qcpubliclibrary.quezoncity.gov.ph",
      last_verified_at: "2026-10-01T09:00:00Z",
    },
    study_amenities: {
      desk_capacity: 150,
      has_power_outlets: true,
      has_wifi: true,
      has_aircon: true,
      has_quiet_zone: true,
      is_free_to_use: true,
      verification: {
        status: "VERIFIED",
        official_source: "QC Public Library Management",
      },
    },
    access_requirements:
      "Open to the general public. Free library registration at entrance.",
    schedules: [
      {
        day_of_week: 1,
        day_name: "Monday",
        open_time: "08:00:00",
        close_time: "17:00:00",
        is_closed: false,
        verification: { status: "VERIFIED" },
      },
      {
        day_of_week: 2,
        day_name: "Tuesday",
        open_time: "08:00:00",
        close_time: "17:00:00",
        is_closed: false,
        verification: { status: "VERIFIED" },
      },
      {
        day_of_week: 3,
        day_name: "Wednesday",
        open_time: "08:00:00",
        close_time: "17:00:00",
        is_closed: false,
        verification: { status: "VERIFIED" },
      },
      {
        day_of_week: 4,
        day_name: "Thursday",
        open_time: "08:00:00",
        close_time: "17:00:00",
        is_closed: false,
        verification: { status: "VERIFIED" },
      },
      {
        day_of_week: 5,
        day_name: "Friday",
        open_time: "08:00:00",
        close_time: "17:00:00",
        is_closed: false,
        verification: { status: "VERIFIED" },
      },
    ],
  },
  {
    id: "d3e4f5a6-7b8c-9d0e-1f2a-3b4c5d6e7f8a",
    name: "Arroceros Forest Park",
    category: "park",
    city: "Manila",
    barangay: "Barangay 659",
    address: "Antonio Villegas St, Ermita, Manila",
    coordinates: { lat: 14.5947, lng: 120.9822 },
    green_index_score: 91.4,
    verification: {
      status: "VERIFIED",
      official_source: "City of Manila Parks Development Office",
      source_url: "https://manila.gov.ph/arroceros-forest-park",
      last_verified_at: "2026-08-20T10:00:00Z",
    },
    study_amenities: {
      desk_capacity: 10,
      has_power_outlets: false,
      has_wifi: false,
      has_aircon: false,
      has_quiet_zone: true,
      is_free_to_use: true,
      verification: {
        status: "VERIFIED",
        official_source: "City of Manila Parks Development Office",
      },
    },
    access_requirements: "Public urban forest park; free admission to all visitors.",
    schedules: [
      {
        day_of_week: 1,
        day_name: "Monday",
        open_time: "05:00:00",
        close_time: "18:00:00",
        is_closed: false,
        verification: { status: "VERIFIED" },
      },
    ],
  },
  {
    id: "e5f6a7b8-9c0d-1e2f-3a4b-5c6d7e8f9a0b",
    name: "Ayala Triangle Gardens",
    category: "garden",
    city: "Makati",
    barangay: "Bel-Air",
    address: "Paseo de Roxas cor. Makati Ave, Bel-Air, Makati",
    coordinates: { lat: 14.5574, lng: 121.0232 },
    green_index_score: 83.0,
    verification: {
      status: "VERIFIED",
      official_source: "Makati City Tourism & Parks",
      source_url: "https://makati.gov.ph/parks",
      last_verified_at: "2026-09-01T10:00:00Z",
    },
    study_amenities: {
      desk_capacity: 20,
      has_power_outlets: false,
      has_wifi: true,
      has_aircon: false,
      has_quiet_zone: false,
      is_free_to_use: true,
      verification: { status: "ESTIMATE", derivation_note: "Outdoor public park Wi-Fi" },
    },
    access_requirements: "Open public urban park and green garden.",
    schedules: [
      {
        day_of_week: 1,
        day_name: "Monday",
        open_time: "06:00:00",
        close_time: "22:00:00",
        is_closed: false,
        verification: { status: "VERIFIED" },
      },
    ],
  },
  {
    id: "f7a8b9c0-1d2e-3f4a-5b6c-7d8e9f0a1b2c",
    name: "Marikina River Park",
    category: "park",
    city: "Marikina",
    barangay: "Santa Elena",
    address: "Riverbanks Center, Santa Elena, Marikina",
    coordinates: { lat: 14.6322, lng: 121.0877 },
    green_index_score: 79.8,
    verification: {
      status: "VERIFIED",
      official_source: "Marikina City Environmental Management",
      last_verified_at: "2026-09-10T08:00:00Z",
    },
    study_amenities: {
      desk_capacity: null,
      has_power_outlets: false,
      has_wifi: false,
      has_aircon: false,
      has_quiet_zone: false,
      is_free_to_use: true,
    },
    access_requirements: "Open linear river park; 24-hour public access.",
    schedules: [
      {
        day_of_week: 1,
        day_name: "Monday",
        open_time: "00:00:00",
        close_time: "23:59:00",
        is_closed: false,
        verification: { status: "VERIFIED" },
      },
    ],
  },
];

export function ExploreView({
  initialPlaces = DEFAULT_EXPLORE_PLACES,
  defaultSelectedPlaceId,
  className = "",
}: ExploreViewProps) {
  const [places] = useState<Place[]>(initialPlaces);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(
    defaultSelectedPlaceId || null
  );
  const [isAreaModalOpen, setIsAreaModalOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"places" | "commute">("places");
  const [activeRoute, setActiveRoute] = useState<RouteOption | null>(null);
  const [commuteDestination, setCommuteDestination] = useState<Place | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  // User location hook with fallback listening
  const {
    coordinates: userCoords,
    permissionState,
    isFallbackActive,
    selectedCity,
    selectedBarangay,
    requestLocation,
    setManualLocation,
  } = useUserLocation({
    autoRequest: false,
    onFallback: () => {
      // Seamlessly surface manual LGU selector when geolocation is denied or timed out (BR-004)
      setIsAreaModalOpen(true);
    },
  });

  const mapInstanceRef = useRef<MapLibreMapInstance | null>(null);
  const markersRef = useRef<Marker[]>([]);

  // Filtered places matching search and category
  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      // Category filter matching F-001
      if (categoryFilter === "parks") {
        if (place.category !== "park" && place.category !== "garden") return false;
      } else if (categoryFilter === "libraries") {
        if (
          place.category !== "library" &&
          place.category !== "reading_center"
        )
          return false;
      }

      // City / Barangay manual filter if selected
      if (selectedCity) {
        if (place.city.toLowerCase() !== selectedCity.toLowerCase()) {
          return false;
        }
      }
      if (selectedBarangay) {
        if (
          !place.barangay.toLowerCase().includes(selectedBarangay.toLowerCase())
        ) {
          return false;
        }
      }

      // Free-text query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = place.name.toLowerCase().includes(q);
        const matchesBarangay = place.barangay.toLowerCase().includes(q);
        const matchesAddress = place.address.toLowerCase().includes(q);
        const matchesCity = place.city.toLowerCase().includes(q);
        return matchesName || matchesBarangay || matchesAddress || matchesCity;
      }

      return true;
    });
  }, [places, categoryFilter, selectedCity, selectedBarangay, searchQuery]);

  const selectedPlace = useMemo(() => {
    if (!selectedPlaceId) return null;
    return places.find((p) => p.id === selectedPlaceId) || null;
  }, [places, selectedPlaceId]);

  // Sync map markers with filtered places
  const updateMapMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add marker for each filtered place
    filteredPlaces.forEach((place) => {
      try {
        const isPark = place.category === "park" || place.category === "garden";
        const pinBgColor = isPark ? "#166534" : "#0D5C3A";

        const el = document.createElement("button");
        el.className =
          "group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-700";
        el.style.backgroundColor = pinBgColor;
        el.setAttribute("aria-label", `Map pin for ${place.name}`);
        el.setAttribute("title", place.name);

        const innerIcon = document.createElement("span");
        innerIcon.className = "text-white text-xs font-bold";
        innerIcon.textContent = isPark ? "🌿" : "📖";
        el.appendChild(innerIcon);

        el.addEventListener("click", () => {
          setSelectedPlaceId(place.id);
          try {
            map.flyTo({
              center: [place.coordinates.lng, place.coordinates.lat],
              zoom: 14,
              speed: 1.2,
            });
          } catch {
            // Ignore flyTo animation error in non-webgl contexts
          }
        });

        const marker = new Marker({ element: el })
          .setLngLat([place.coordinates.lng, place.coordinates.lat])
          .addTo(map);

        markersRef.current.push(marker);
      } catch {
        // Fallback for mock/test environments lacking MapLibre DOM support
      }
    });
  }, [filteredPlaces]);

  useEffect(() => {
    updateMapMarkers();
  }, [updateMapMarkers]);

  const handleMapLoad = (map: MapLibreMapInstance) => {
    mapInstanceRef.current = map;
    setMapLoaded(true);
    updateMapMarkers();
  };

  // Fly to user coordinates when GPS or manual area changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userCoords) return;
    try {
      map.flyTo({
        center: [userCoords.lng, userCoords.lat],
        zoom: 13,
        speed: 1.2,
      });
    } catch {
      // Ignore
    }
  }, [userCoords]);

  return (
    <div
      className={`relative flex h-[calc(100vh-4rem)] min-h-[600px] w-full flex-col overflow-hidden bg-[#F4F1EA] md:flex-row ${className}`}
      data-testid="explore-view"
    >
      {/* Side Panel / Drawer */}
      <aside
        className="z-10 flex w-full flex-col border-b border-stone-200/90 bg-[#FDFBF7] shadow-xl md:w-[420px] md:border-b-0 md:border-r"
        aria-label="Explore search and places drawer"
      >
        {/* Search & Location Bar */}
        {/* Top View Mode Switcher: Places vs Commute */}
        <div className="border-b border-stone-200/80 p-4">
          <div className="mb-3 flex rounded-xl bg-stone-100 p-1 border border-stone-200" role="tablist" aria-label="Explore or Commute Planner view">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "places"}
              onClick={() => setViewMode("places")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                viewMode === "places"
                  ? "bg-white text-emerald-950 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              🌿 Discover Places
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "commute"}
              onClick={() => setViewMode("commute")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                viewMode === "commute"
                  ? "bg-white text-emerald-950 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              🧭 Shaded Commute
            </button>
          </div>

          {viewMode === "places" ? (
            <>
          <div className="relative">
            <Search
              className="absolute left-3.5 top-3 h-4 w-4 text-stone-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search parks, libraries, barangays..."
              aria-label="Search civic spaces and libraries"
              className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-9 text-xs font-medium text-stone-900 placeholder:text-stone-400 shadow-2xs focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-2.5 rounded-md p-0.5 text-stone-400 hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Pill Bar (F-001) */}
          <div
            role="tablist"
            aria-label="Filter places by category"
            className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={categoryFilter === "all"}
              onClick={() => setCategoryFilter("all")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                categoryFilter === "all"
                  ? "bg-emerald-900 text-white shadow-xs"
                  : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              <Compass className="h-3.5 w-3.5" aria-hidden="true" />
              <span>All Spaces</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={categoryFilter === "parks"}
              onClick={() => setCategoryFilter("parks")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                categoryFilter === "parks"
                  ? "bg-emerald-900 text-white shadow-xs"
                  : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              <TreePine className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              <span>Parks & Gardens</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={categoryFilter === "libraries"}
              onClick={() => setCategoryFilter("libraries")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                categoryFilter === "libraries"
                  ? "bg-emerald-900 text-white shadow-xs"
                  : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-teal-600" aria-hidden="true" />
              <span>Libraries & Study</span>
            </button>
          </div>

          {/* Location Area Status & Selector Trigger (F-006 / BR-004) */}
          <div className="mt-3 flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-2 text-xs">
            <div className="flex items-center gap-1.5 truncate text-stone-700">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-800" aria-hidden="true" />
              <span className="truncate font-medium">
                {selectedCity
                  ? `${selectedBarangay ? `${selectedBarangay}, ` : ""}${selectedCity}`
                  : permissionState === "granted"
                  ? "Current Location (GPS)"
                  : "Metro Manila (All 17 LGUs)"}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsAreaModalOpen(true)}
                aria-label="Choose Metro Manila city or barangay"
                className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-stone-200 shadow-2xs hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                Change Area
              </button>

              <button
                type="button"
                onClick={() => requestLocation()}
                title="Use GPS Location"
                aria-label="Use GPS Location"
                className="rounded-lg bg-white p-1 text-stone-600 border border-stone-200 hover:text-emerald-800 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <Navigation className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
            </>
          ) : (
            <div className="text-xs text-stone-500 font-medium">
              Plan shaded commute routes across Metro Manila
            </div>
          )}
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {viewMode === "commute" ? (
            <RoutePlanner
              initialOrigin={userCoords}
              initialDestination={commuteDestination?.coordinates}
              onSelectRoute={(rt) => setActiveRoute(rt)}
              onRoutesCalculated={(rts) => setActiveRoute(rts[0] || null)}
            />
          ) : selectedPlace ? (
            <div>
              {/* Back to list button */}
              <button
                type="button"
                onClick={() => setSelectedPlaceId(null)}
                aria-label="Back to results"
                className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 hover:text-emerald-950 focus:outline-none"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to places list</span>
              </button>

              <FacilityProfile
                facility={selectedPlace}
                onClose={() => setSelectedPlaceId(null)}
                onGetDirections={(fac) => {
                  setCommuteDestination(fac);
                  setViewMode("commute");
                }}
              />
            </div>
          ) : (
            <div>
              <div className="mb-2.5 flex items-center justify-between text-xs font-semibold text-stone-500">
                <span>
                  Showing {filteredPlaces.length}{" "}
                  {filteredPlaces.length === 1 ? "space" : "spaces"}
                </span>
                {selectedCity && (
                  <button
                    type="button"
                    onClick={() => setManualLocation("")}
                    className="text-emerald-800 hover:underline"
                  >
                    Clear city filter
                  </button>
                )}
              </div>

              {filteredPlaces.length === 0 ? (
                <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                    <TreePine className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-stone-900">
                    No civic spaces found
                  </h3>
                  <p className="mt-1 text-xs text-stone-500">
                    No results match your search or area filters. Try resetting
                    filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("all");
                      setManualLocation("");
                    }}
                    className="mt-4 rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-900"
                  >
                    Reset all filters
                  </button>
                </div>
              ) : (
                <div className="space-y-3" role="feed" aria-label="Discovered spaces">
                  {filteredPlaces.map((place) => {
                    const isSelected = place.id === selectedPlaceId;
                    const isPark =
                      place.category === "park" || place.category === "garden";

                    return (
                      <article
                        key={place.id}
                        onClick={() => setSelectedPlaceId(place.id)}
                        className={`group relative flex cursor-pointer flex-col rounded-xl border p-3.5 transition-all hover:border-emerald-600 hover:shadow-md ${
                          isSelected
                            ? "border-emerald-700 bg-emerald-50/50 ring-1 ring-emerald-700"
                            : "border-stone-200 bg-white"
                        }`}
                        tabIndex={0}
                        role="article"
                        aria-label={`View details for ${place.name}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedPlaceId(place.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-700">
                                {isPark ? (
                                  <TreePine className="h-3 w-3 text-emerald-700" />
                                ) : (
                                  <BookOpen className="h-3 w-3 text-teal-700" />
                                )}
                                {place.category.replace("_", " ")}
                              </span>

                              {place.green_index_score != null && (
                                <GreenIndexPill
                                  score={place.green_index_score}
                                  size="sm"
                                  placeName={place.name}
                                  verification={place.verification}
                                />
                              )}
                            </div>

                            <h3 className="mt-1.5 text-sm font-bold text-stone-900 group-hover:text-emerald-900">
                              {place.name}
                            </h3>

                            <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                              <MapPin className="h-3 w-3 shrink-0 text-emerald-700" />
                              <span>
                                {place.barangay}, {place.city}
                              </span>
                            </p>
                          </div>

                          <div className="shrink-0">
                            <VerificationBadge
                              status={place.verification?.status ?? "NOT_AVAILABLE"}
                              sourceName={
                                place.verification?.official_source_name ||
                                place.verification?.official_source
                              }
                            />
                          </div>
                        </div>

                        {/* Amenities preview */}
                        {place.study_amenities && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-2 text-[11px] text-stone-600">
                            {place.study_amenities.desk_capacity != null && (
                              <span className="rounded bg-stone-50 px-1.5 py-0.5 font-medium">
                                🪑 {place.study_amenities.desk_capacity} Desks
                              </span>
                            )}
                            {place.study_amenities.has_wifi && (
                              <span className="rounded bg-stone-50 px-1.5 py-0.5 font-medium">
                                📶 Free Wi-Fi
                              </span>
                            )}
                            {place.study_amenities.has_power_outlets && (
                              <span className="rounded bg-stone-50 px-1.5 py-0.5 font-medium">
                                ⚡ Power
                              </span>
                            )}
                            {place.study_amenities.has_aircon && (
                              <span className="rounded bg-stone-50 px-1.5 py-0.5 font-medium">
                                ❄️ Aircon
                              </span>
                            )}
                          </div>
                        )}

                        <div className="mt-2 flex items-center justify-end text-xs font-semibold text-emerald-800 group-hover:translate-x-0.5 transition-transform">
                          <span>View Profile</span>
                          <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Map Canvas */}
      <main
        className="relative flex-1 overflow-hidden"
        aria-label="Metro Manila Civic Spaces Interactive Map"
      >
        <MapLibreMap
          center={
            userCoords
              ? [userCoords.lng, userCoords.lat]
              : DEFAULT_METRO_MANILA_CENTER
          }
          zoom={userCoords ? 13 : 12}
          onMapLoad={handleMapLoad}
          className="h-full w-full"
        >
          {mapLoaded && <RouteShadeLayer map={mapInstanceRef.current} route={activeRoute} />}
        </MapLibreMap>
      </main>

      {/* Manual Area Selector Modal (F-006 / BR-004) */}
      <LGUSelectorModal
        isOpen={isAreaModalOpen}
        onClose={() => setIsAreaModalOpen(false)}
        selectedCity={selectedCity}
        selectedBarangay={selectedBarangay}
        onSelectLocation={({ city, barangay, coordinates }) => {
          setManualLocation(city, barangay, coordinates);
        }}
      />
    </div>
  );
}
