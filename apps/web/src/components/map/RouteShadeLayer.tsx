"use client";

import React, { useEffect, useRef } from "react";
import type { Map, GeoJSONSource } from "maplibre-gl";
import { LngLatBounds, Popup } from "maplibre-gl";
import type { RouteLeg, RouteOption } from "@/types/routing";

export interface RouteShadeLayerProps {
  map: Map | null;
  route: RouteOption | null;
  sourceId?: string;
  casingLayerId?: string;
  lineLayerId?: string;
  fitBoundsOnChange?: boolean;
  onSegmentClick?: (segment: {
    sequence: number;
    mode: string;
    shadePct: number;
    distanceM: number;
    instruction: string;
  }) => void;
}

// Design System Semantic Shade Colors
export const SHADE_COLORS = {
  HIGH_CANOPY: "#245C43", // Forest Green (>= 70% Shade)
  MODERATE_CANOPY: "#84CC16", // Lime (40% - 69% Shade)
  EXPOSED_SUN: "#D97706", // Amber (< 40% Shade)
  RAIL_TRANSIT: "#4F46E5", // Indigo Rail Line
  BUS_TRANSIT: "#2563EB", // Blue Bus Route
  JEEPNEY_TRANSIT: "#B45309", // Warm Amber Jeepney
} as const;

export function getSegmentColor(mode: string, shadePct: number): string {
  if (mode === "rail") return SHADE_COLORS.RAIL_TRANSIT;
  if (mode === "bus") return SHADE_COLORS.BUS_TRANSIT;
  if (mode === "jeepney") return SHADE_COLORS.JEEPNEY_TRANSIT;

  // Pedestrian & walking segments color-coded by EQ-002 canopy shade
  if (shadePct >= 70) return SHADE_COLORS.HIGH_CANOPY;
  if (shadePct >= 40) return SHADE_COLORS.MODERATE_CANOPY;
  return SHADE_COLORS.EXPOSED_SUN;
}

export function buildRouteGeoJSON(route: RouteOption) {
  const features = route.legs.map((leg) => {
    const isWalk = leg.mode === "walk" || leg.mode === "transfer";
    const color = getSegmentColor(leg.mode, leg.shade_coverage_pct);

    return {
      type: "Feature" as const,
      id: leg.id || `leg-${leg.sequence}`,
      properties: {
        sequence: leg.sequence,
        mode: leg.mode,
        instruction: leg.instruction,
        distance_m: leg.distance_m,
        duration_seconds: leg.duration_seconds,
        shade_coverage_pct: leg.shade_coverage_pct,
        color,
        lineWidth: isWalk ? 5 : 6,
        isTransfer: leg.mode === "transfer",
        transit_line: leg.transit_line || "",
        fare_amount: leg.fare.amount_php,
      },
      geometry: leg.path_geometry_geojson,
    };
  });

  return {
    type: "FeatureCollection" as const,
    features,
  };
}

export function RouteShadeLayer({
  map,
  route,
  sourceId = "lunhaw-route-shade-source",
  casingLayerId = "lunhaw-route-casing-layer",
  lineLayerId = "lunhaw-route-shade-layer",
  fitBoundsOnChange = true,
  onSegmentClick,
}: RouteShadeLayerProps) {
  const popupRef = useRef<Popup | null>(null);

  useEffect(() => {
    if (!map) return;

    // Check if map style has loaded
    const isStyleLoaded = map.isStyleLoaded();
    if (!isStyleLoaded) {
      const handleLoad = () => {
        // Re-trigger effect when style finishes loading
        updateLayers();
      };
      map.once("load", handleLoad);
      return () => {
        map.off("load", handleLoad);
      };
    }

    updateLayers();

    function updateLayers() {
      if (!map || !map.getStyle()) return;

      // If no route, clear layers and sources
      if (!route || route.legs.length === 0) {
        removeLayersAndSource();
        return;
      }

      const geojsonData = buildRouteGeoJSON(route);

      // 1. Update or Add GeoJSON Source
      const existingSource = map.getSource(sourceId) as GeoJSONSource | undefined;
      if (existingSource) {
        existingSource.setData(geojsonData);
      } else {
        map.addSource(sourceId, {
          type: "geojson",
          data: geojsonData,
        });
      }

      // 2. Add Casing Layer (for crisp outdoor sunlight contrast)
      if (!map.getLayer(casingLayerId)) {
        map.addLayer({
          id: casingLayerId,
          type: "line",
          source: sourceId,
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#FFFFFF",
            "line-width": 8,
            "line-opacity": 0.95,
          },
        });
      }

      // 3. Add Colored Route Shade Layer
      if (!map.getLayer(lineLayerId)) {
        map.addLayer({
          id: lineLayerId,
          type: "line",
          source: sourceId,
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": ["get", "color"],
            "line-width": ["get", "lineWidth"],
            "line-opacity": 1.0,
          },
        });

        // 4. Interactive Click & Hover Events
        map.on("click", lineLayerId, (e) => {
          const firstFeature = e.features?.[0];
          if (!firstFeature || !firstFeature.properties) return;
          const props = firstFeature.properties;

          const seq = Number(props.sequence);
          const mode = String(props.mode);
          const shade = Number(props.shade_coverage_pct);
          const dist = Number(props.distance_m);
          const inst = String(props.instruction);

          onSegmentClick?.({
            sequence: seq,
            mode,
            shadePct: shade,
            distanceM: dist,
            instruction: inst,
          });

          // Display MapLibre Popup
          const coordinates = e.lngLat;
          if (popupRef.current) popupRef.current.remove();

          const isWalkMode = mode === "walk" || mode === "transfer";
          const shadeBadge = isWalkMode
            ? `<div style="font-weight: 700; color: ${getSegmentColor(mode, shade)}; margin-top: 4px;">
                🌿 ${shade.toFixed(0)}% Tree Canopy Shade (EQ-002)
               </div>`
            : `<div style="font-weight: 700; color: #1E293B; margin-top: 4px;">
                Transit Route
               </div>`;

          popupRef.current = new Popup({ offset: 12, closeButton: true })
            .setLngLat(coordinates)
            .setHTML(
              `<div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
                <div style="font-weight: bold; color: #1E293B;">Step ${seq}: ${inst}</div>
                <div style="color: #64748B; font-size: 11px; margin-top: 2px;">${Math.round(dist)} meters</div>
                ${shadeBadge}
              </div>`
            )
            .addTo(map);
        });

        // Change cursor to pointer on hover
        map.on("mouseenter", lineLayerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", lineLayerId, () => {
          map.getCanvas().style.cursor = "";
        });
      }

      // 5. Fit Map Bounds to Route
      if (fitBoundsOnChange && route.geometry_geojson.coordinates.length > 0) {
        const coords = route.geometry_geojson.coordinates;
        const bounds = new LngLatBounds(coords[0], coords[0]);
        for (const coord of coords) {
          bounds.extend(coord);
        }
        map.fitBounds(bounds, {
          padding: 60,
          maxZoom: 16,
          duration: 800,
        });
      }
    }

    function removeLayersAndSource() {
      if (!map || !map.getStyle()) return;
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      if (map.getLayer(lineLayerId)) {
        map.removeLayer(lineLayerId);
      }
      if (map.getLayer(casingLayerId)) {
        map.removeLayer(casingLayerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    }

    return () => {
      removeLayersAndSource();
    };
  }, [map, route, sourceId, casingLayerId, lineLayerId, fitBoundsOnChange, onSegmentClick]);

  return null;
}
