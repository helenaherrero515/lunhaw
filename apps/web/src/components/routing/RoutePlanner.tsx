"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  ArrowUpDown,
  Navigation,
  Sparkles,
  TreePine,
  Zap,
  Footprints,
  RotateCcw,
  Search,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import type { Coordinates, RouteOption, RoutePreference } from "@/types/routing";
import { findCommuteRoutes } from "@/lib/routing/router";
import { RouteComparison } from "./RouteComparison";

export interface RoutePlannerProps {
  initialOrigin?: Coordinates | null;
  initialDestination?: Coordinates | null;
  initialPreference?: RoutePreference;
  onRoutesCalculated?: (routes: RouteOption[]) => void;
  onSelectRoute?: (route: RouteOption) => void;
  onPickerModeChange?: (mode: "origin" | "destination" | null) => void;
  mapPickedCoordinate?: {
    mode: "origin" | "destination";
    coords: Coordinates;
    label?: string;
  } | null;
  className?: string;
}

export interface PresetLocation {
  name: string;
  lgu: string;
  coords: Coordinates;
}

export const NCR_COMMUTE_PRESETS: PresetLocation[] = [
  {
    name: "Barangay San Antonio Reading Center",
    lgu: "Pasig",
    coords: { lat: 14.5823, lng: 121.0611 },
  },
  {
    name: "National Library of the Philippines",
    lgu: "Manila",
    coords: { lat: 14.5825, lng: 120.9822 },
  },
  {
    name: "UP Diliman Academic Oval",
    lgu: "Quezon City",
    coords: { lat: 14.6538, lng: 121.0689 },
  },
  {
    name: "Ayala Triangle Gardens",
    lgu: "Makati",
    coords: { lat: 14.5574, lng: 121.0238 },
  },
  {
    name: "Rizal Park (Luneta)",
    lgu: "Manila",
    coords: { lat: 14.5831, lng: 120.9794 },
  },
  {
    name: "Ortigas Park (Emerald Ave)",
    lgu: "Pasig",
    coords: { lat: 14.5872, lng: 121.0608 },
  },
];

export function RoutePlanner({
  initialOrigin = null,
  initialDestination = null,
  initialPreference = "shaded_walk",
  onRoutesCalculated,
  onSelectRoute,
  onPickerModeChange,
  mapPickedCoordinate,
  className = "",
}: RoutePlannerProps) {
  const [origin, setOrigin] = useState<Coordinates | null>(
    initialOrigin || { lat: 14.5878, lng: 121.0567 } // Default: MRT Ortigas
  );
  const [originText, setOriginText] = useState<string>("MRT-3 Ortigas Station");

  const [destination, setDestination] = useState<Coordinates | null>(
    initialDestination || { lat: 14.5823, lng: 121.0611 } // Default: San Antonio Reading Center
  );
  const [destinationText, setDestinationText] = useState<string>(
    "Barangay San Antonio Reading Center"
  );

  const [preference, setPreference] = useState<RoutePreference>(initialPreference);
  const [pickerMode, setPickerMode] = useState<"origin" | "destination" | null>(null);

  const [isCalculating, setIsCalculating] = useState(false);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync external pin picks from map
  useEffect(() => {
    if (mapPickedCoordinate) {
      if (mapPickedCoordinate.mode === "origin") {
        setOrigin(mapPickedCoordinate.coords);
        setOriginText(
          mapPickedCoordinate.label ||
            `Pinned Location (${mapPickedCoordinate.coords.lat.toFixed(4)}, ${mapPickedCoordinate.coords.lng.toFixed(4)})`
        );
      } else if (mapPickedCoordinate.mode === "destination") {
        setDestination(mapPickedCoordinate.coords);
        setDestinationText(
          mapPickedCoordinate.label ||
            `Pinned Location (${mapPickedCoordinate.coords.lat.toFixed(4)}, ${mapPickedCoordinate.coords.lng.toFixed(4)})`
        );
      }
      setPickerMode(null);
      onPickerModeChange?.(null);
    }
  }, [mapPickedCoordinate, onPickerModeChange]);

  // Execute Route Finding
  const calculateRoutes = useCallback(
    async (
      orig: Coordinates | null,
      dest: Coordinates | null,
      pref: RoutePreference
    ) => {
      if (!orig || !dest) return;

      setIsCalculating(true);
      setError(null);

      try {
        const resultRoutes = await findCommuteRoutes(orig, dest, pref);
        setRoutes(resultRoutes);
        const topRoute = resultRoutes[0] || null;
        setSelectedRoute(topRoute);
        onRoutesCalculated?.(resultRoutes);
        if (topRoute) {
          onSelectRoute?.(topRoute);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Route calculation failed";
        setError(msg);
      } finally {
        setIsCalculating(false);
      }
    },
    [onRoutesCalculated, onSelectRoute]
  );

  // Trigger initial calculation
  useEffect(() => {
    if (origin && destination) {
      calculateRoutes(origin, destination, preference);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Reverse Route
  const handleReverseRoute = () => {
    const tempCoords = origin;
    const tempText = originText;
    setOrigin(destination);
    setOriginText(destinationText);
    setDestination(tempCoords);
    setDestinationText(tempText);

    if (destination && origin) {
      calculateRoutes(destination, origin, preference);
    }
  };

  // Handle Pin Picker Toggle
  const togglePicker = (mode: "origin" | "destination") => {
    const nextMode = pickerMode === mode ? null : mode;
    setPickerMode(nextMode);
    onPickerModeChange?.(nextMode);
  };

  // Preference change
  const handlePreferenceChange = (newPref: RoutePreference) => {
    setPreference(newPref);
    if (origin && destination) {
      calculateRoutes(origin, destination, newPref);
    }
  };

  const handleSelectPreset = (preset: PresetLocation, target: "origin" | "destination") => {
    if (target === "origin") {
      setOrigin(preset.coords);
      setOriginText(`${preset.name} (${preset.lgu})`);
      if (destination) calculateRoutes(preset.coords, destination, preference);
    } else {
      setDestination(preset.coords);
      setDestinationText(`${preset.name} (${preset.lgu})`);
      if (origin) calculateRoutes(origin, preset.coords, preference);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Route Input Panel */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white">
              <Navigation className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">Commute & Shade Route Planner</h2>
              <p className="text-xs text-stone-500">Plan cool, tree-shaded walking and transit journeys</p>
            </div>
          </div>

          {/* Reverse button */}
          <button
            type="button"
            onClick={handleReverseRoute}
            aria-label="Reverse route origin and destination"
            title="Swap Origin and Destination"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>

        {/* Inputs Stack */}
        <div className="mt-4 space-y-3">
          {/* Origin Input */}
          <div className="relative">
            <label htmlFor="origin-input" className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Starting Point (Origin)
            </label>
            <div className="mt-1 flex items-center rounded-xl border border-stone-300 bg-stone-50/50 px-3 py-2 shadow-xs focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-600/20">
              <MapPin className="h-4 w-4 text-emerald-700 shrink-0 mr-2" />
              <input
                id="origin-input"
                type="text"
                value={originText}
                onChange={(e) => setOriginText(e.target.value)}
                placeholder="Enter starting location or drop pin..."
                className="w-full bg-transparent text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => togglePicker("origin")}
                className={`ml-2 shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all ${
                  pickerMode === "origin"
                    ? "bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-500/30"
                    : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
                }`}
              >
                {pickerMode === "origin" ? "Click Map..." : "Pin Map"}
              </button>
            </div>
          </div>

          {/* Destination Input */}
          <div className="relative">
            <label htmlFor="destination-input" className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Destination
            </label>
            <div className="mt-1 flex items-center rounded-xl border border-stone-300 bg-stone-50/50 px-3 py-2 shadow-xs focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-600/20">
              <MapPin className="h-4 w-4 text-amber-600 shrink-0 mr-2" />
              <input
                id="destination-input"
                type="text"
                value={destinationText}
                onChange={(e) => setDestinationText(e.target.value)}
                placeholder="Enter destination or study haven..."
                className="w-full bg-transparent text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => togglePicker("destination")}
                className={`ml-2 shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all ${
                  pickerMode === "destination"
                    ? "bg-amber-600 text-white border-amber-600 ring-2 ring-amber-500/30"
                    : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
                }`}
              >
                {pickerMode === "destination" ? "Click Map..." : "Pin Map"}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Civic Haven Presets */}
        <div className="mt-4 pt-3 border-t border-stone-100">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
            Quick Destinations (Civic Study Havens & Parks)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {NCR_COMMUTE_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleSelectPreset(preset, "destination")}
                className="rounded-lg bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 border border-stone-200 hover:border-emerald-300 transition-colors"
              >
                {preset.name.split(" ")[0]} ({preset.lgu})
              </button>
            ))}
          </div>
        </div>

        {/* Routing Preference Selector */}
        <div className="mt-4 pt-3 border-t border-stone-100">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
            Route Preference
          </label>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Route preference selector">
            {/* Shaded Walk */}
            <button
              type="button"
              role="radio"
              aria-checked={preference === "shaded_walk"}
              onClick={() => handlePreferenceChange("shaded_walk")}
              className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                preference === "shaded_walk"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-1 ring-emerald-600"
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              <TreePine className="h-4 w-4 mb-1 text-emerald-700" />
              <span>Shaded Green</span>
            </button>

            {/* Fastest */}
            <button
              type="button"
              role="radio"
              aria-checked={preference === "fastest"}
              onClick={() => handlePreferenceChange("fastest")}
              className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                preference === "fastest"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-1 ring-emerald-600"
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              <Zap className="h-4 w-4 mb-1 text-amber-600" />
              <span>Fastest</span>
            </button>

            {/* Least Walking */}
            <button
              type="button"
              role="radio"
              aria-checked={preference === "least_walking"}
              onClick={() => handlePreferenceChange("least_walking")}
              className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                preference === "least_walking"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-1 ring-emerald-600"
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              <Footprints className="h-4 w-4 mb-1 text-stone-600" />
              <span>Least Walking</span>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4">
          <button
            type="button"
            disabled={!origin || !destination || isCalculating}
            onClick={() => calculateRoutes(origin, destination, preference)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isCalculating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Computing A* Shaded Route...</span>
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                <span>Find Route Options</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            {error}
          </div>
        )}
      </div>

      {/* Route Comparison and Direction Cards */}
      {routes.length > 0 && (
        <RouteComparison
          routes={routes}
          selectedRouteId={selectedRoute?.route_id}
          onSelectRoute={(rt) => {
            setSelectedRoute(rt);
            onSelectRoute?.(rt);
          }}
        />
      )}
    </div>
  );
}
