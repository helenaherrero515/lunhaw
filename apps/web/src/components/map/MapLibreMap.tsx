"use client";

import * as React from "react";
import { Map, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export const DEFAULT_METRO_MANILA_CENTER: [number, number] = [120.9842, 14.5995];
export const DEFAULT_ZOOM = 12;
export const OPENFREEMAP_LIBERTY_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export interface MapLibreMapProps {
  center?: [number, number];
  zoom?: number;
  styleUrl?: string;
  className?: string;
  containerId?: string;
  ariaLabel?: string;
  interactive?: boolean;
  minZoom?: number;
  maxZoom?: number;
  onMapLoad?: (map: Map) => void;
  children?: React.ReactNode;
}

export function MapLibreMap({
  center = DEFAULT_METRO_MANILA_CENTER,
  zoom = DEFAULT_ZOOM,
  styleUrl = OPENFREEMAP_LIBERTY_STYLE,
  className,
  containerId = "lunhaw-maplibre-container",
  ariaLabel = "Metro Manila green spaces and study havens map",
  interactive = true,
  minZoom,
  maxZoom,
  onMapLoad,
  children,
}: MapLibreMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<Map | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [initError, setInitError] = React.useState<string | null>(null);

  const onMapLoadRef = React.useRef(onMapLoad);
  onMapLoadRef.current = onMapLoad;

  // Initialize MapLibre instance
  React.useEffect(() => {
    if (!containerRef.current) return;

    let mapInstance: Map | null = null;
    let resizeObserver: ResizeObserver | null = null;

    try {
      mapInstance = new Map({
        container: containerRef.current,
        style: styleUrl,
        center,
        zoom,
        interactive,
        minZoom,
        maxZoom,
      });

      const navControl = new NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      });
      mapInstance.addControl(navControl, "top-right");

      mapInstance.on("load", () => {
        setIsLoaded(true);
        onMapLoadRef.current?.(mapInstance!);
      });

      mapRef.current = mapInstance;

      // Handle responsive container resizing
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          mapInstance?.resize();
        });
        resizeObserver.observe(containerRef.current);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to initialize map";
      setInitError(message);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstance) {
        mapInstance.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleUrl]);

  const [centerLng, centerLat] = center;
  // Update center when prop changes dynamically after initial render
  React.useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    mapRef.current.setCenter([centerLng, centerLat]);
  }, [centerLng, centerLat, isLoaded]);

  // Update zoom when prop changes dynamically after initial render
  React.useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    mapRef.current.setZoom(zoom);
  }, [zoom, isLoaded]);

  return (
    <div
      ref={containerRef}
      id={containerId}
      role="region"
      aria-label={ariaLabel}
      className={
        className ||
        "relative h-full min-h-[400px] w-full overflow-hidden rounded-2xl bg-[#E8F1EA]"
      }
      data-testid="maplibre-container"
      data-map-loaded={isLoaded}
    >
      {initError && (
        <div
          role="alert"
          className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 p-4 text-center text-slate-700"
        >
          <p className="font-semibold text-slate-900">Map unavailable</p>
          <p className="text-sm">{initError}</p>
        </div>
      )}
      {children}
    </div>
  );
}

MapLibreMap.displayName = "MapLibreMap";
