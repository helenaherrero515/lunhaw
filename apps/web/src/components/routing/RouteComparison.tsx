"use client";

import React, { useState } from "react";
import { Clock, Navigation, TreePine, Banknote, ChevronDown, ChevronUp, Check } from "lucide-react";
import { VerificationBadge } from "@lunhaw/ui";
import type { RouteOption } from "@/types/routing";
import { RouteStepCard } from "./RouteStepCard";
import { GreenIndexPill } from "../green-index/GreenIndexPill";

export interface RouteComparisonProps {
  routes: RouteOption[];
  selectedRouteId?: string;
  onSelectRoute?: (route: RouteOption) => void;
  className?: string;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} mins`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hrs}h ${remainingMins}m`;
}

export function RouteComparison({
  routes,
  selectedRouteId,
  onSelectRoute,
  className = "",
}: RouteComparisonProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string>(
    selectedRouteId || routes[0]?.route_id || ""
  );
  const [expandedStepsId, setExpandedStepsId] = useState<string | null>(
    selectedRouteId || routes[0]?.route_id || null
  );

  const activeId = selectedRouteId || internalSelectedId;
  const activeRoute = routes.find((r) => r.route_id === activeId) || routes[0];

  const handleSelect = (route: RouteOption) => {
    setInternalSelectedId(route.route_id);
    setExpandedStepsId(route.route_id);
    onSelectRoute?.(route);
  };

  const toggleExpandSteps = (routeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedStepsId((prev) => (prev === routeId ? null : routeId));
  };

  if (!routes || routes.length === 0) {
    return (
      <div className={`rounded-2xl border border-stone-200 bg-white p-6 text-center text-stone-500 ${className}`}>
        <p className="text-sm">No commute routes calculated yet. Select an origin and destination above.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Route Cards Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
          Route Options ({routes.length})
        </h3>
        <span className="text-xs text-stone-400">Click a route to view step-by-step directions</span>
      </div>

      {/* Route Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3" role="radiogroup" aria-label="Route comparison options">
        {routes.map((route) => {
          const isSelected = route.route_id === activeId;
          const isShadedOption = route.preference_tag === "shaded_walk" || route.average_shade_score >= 70;

          return (
            <div
              key={route.route_id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => handleSelect(route)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(route);
                }
              }}
              className={`relative cursor-pointer rounded-2xl border p-4 transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 ${
                isSelected
                  ? "border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600 shadow-md"
                  : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50"
              }`}
            >
              {/* Top Row: Title, Tag, and Checkmark */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        isShadedOption
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : "bg-stone-100 text-stone-800 border border-stone-200"
                      }`}
                    >
                      {isShadedOption ? "🌿 High Shade" : "⚡ Fastest"}
                    </span>
                    <h4 className="text-sm font-bold text-stone-900">{route.title}</h4>
                  </div>
                </div>

                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-stone-300 bg-white"
                  }`}
                  aria-hidden="true"
                >
                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>

              {/* Middle Metrics Row */}
              <div className="mt-3 grid grid-cols-3 gap-2 border-y border-stone-100 py-2.5 text-xs">
                {/* Duration */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-semibold text-stone-400">Duration</span>
                  <div className="flex items-center gap-1 font-bold text-stone-900 text-sm">
                    <Clock className="h-3.5 w-3.5 text-stone-500" />
                    <span>{formatDuration(route.est_duration_seconds)}</span>
                  </div>
                </div>

                {/* Distance */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-semibold text-stone-400">Distance</span>
                  <div className="flex items-center gap-1 font-bold text-stone-900 text-sm">
                    <Navigation className="h-3.5 w-3.5 text-stone-500" />
                    <span>{formatDistance(route.total_distance_m)}</span>
                  </div>
                </div>

                {/* Shade Score */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-semibold text-stone-400">Shade</span>
                  <div className="mt-0.5">
                    <GreenIndexPill
                      score={route.average_shade_score}
                      size="sm"
                      showModalOnClick={false}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Row: Total Fare & Verification Badge (INV-001) */}
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-stone-800">
                  <Banknote className="h-3.5 w-3.5 text-stone-500" />
                  <span>
                    {route.fare.amount_php === 0 ? "Free Walk" : `₱${route.fare.amount_php.toFixed(2)}`}
                  </span>
                  <VerificationBadge
                    status={route.fare.verification.status}
                    sourceName={route.fare.verification.official_source}
                    derivationNote={route.fare.verification.derivation_note}
                    lastVerifiedAt={route.fare.verification.last_verified_at}
                  />
                </div>

                <button
                  type="button"
                  onClick={(e) => toggleExpandSteps(route.route_id, e)}
                  aria-expanded={expandedStepsId === route.route_id}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-900"
                >
                  <span>{route.legs.length} steps</span>
                  {expandedStepsId === route.route_id ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Step-by-Step Directions */}
      {activeRoute && expandedStepsId === activeRoute.route_id && (
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h4 className="text-sm font-bold text-stone-900">
                Turn-by-Turn Commute Directions
              </h4>
              <p className="text-xs text-stone-500">
                {activeRoute.title} • {formatDistance(activeRoute.total_distance_m)} • {formatDuration(activeRoute.est_duration_seconds)}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-stone-700">Total Fare:</span>
              <span className="font-mono text-sm font-extrabold text-emerald-900">
                {activeRoute.fare.amount_php === 0 ? "Free" : `₱${activeRoute.fare.amount_php.toFixed(2)}`}
              </span>
            </div>
          </div>

          <div className="space-y-0">
            {activeRoute.legs.map((leg, idx) => (
              <RouteStepCard
                key={leg.id || idx}
                leg={leg}
                isLast={idx === activeRoute.legs.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
