"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Coordinates } from "@/types/places";

export type GeolocationPermissionState =
  | "prompt"
  | "granted"
  | "denied"
  | "unavailable"
  | "timeout";

export interface UserLocationState {
  coordinates: Coordinates | null;
  permissionState: GeolocationPermissionState;
  isLoading: boolean;
  error: string | null;
  isFallbackActive: boolean;
  selectedCity: string | null;
  selectedBarangay: string | null;
  requestLocation: () => Promise<Coordinates | null>;
  setManualLocation: (
    city: string,
    barangay?: string,
    coords?: Coordinates | null
  ) => void;
  clearManualLocation: () => void;
}

export interface UseUserLocationOptions {
  autoRequest?: boolean;
  timeoutMs?: number; // Defaults to 5000ms (5s timeout per C-M1-01)
  onFallback?: () => void;
}

export const NCR_CITY_CENTROIDS: Record<string, Coordinates> = {
  Manila: { lat: 14.5995, lng: 120.9842 },
  "Quezon City": { lat: 14.676, lng: 121.0437 },
  Caloocan: { lat: 14.65, lng: 120.983 },
  "Las Piñas": { lat: 14.4445, lng: 120.9939 },
  Makati: { lat: 14.5547, lng: 121.0244 },
  Malabon: { lat: 14.6625, lng: 120.9569 },
  Mandaluyong: { lat: 14.5794, lng: 121.0359 },
  Marikina: { lat: 14.6507, lng: 121.1029 },
  Muntinlupa: { lat: 14.4081, lng: 121.0415 },
  Navotas: { lat: 14.6667, lng: 120.9417 },
  Parañaque: { lat: 14.4793, lng: 121.0198 },
  Pasay: { lat: 14.5378, lng: 121.0014 },
  Pasig: { lat: 14.5764, lng: 121.0851 },
  Pateros: { lat: 14.5454, lng: 121.0686 },
  "San Juan": { lat: 14.6019, lng: 121.0355 },
  Taguig: { lat: 14.5176, lng: 121.0509 },
  Valenzuela: { lat: 14.7011, lng: 120.983 },
};

export const GEOLOCATION_TIMEOUT_MS = 5000;

export function useUserLocation(
  options: UseUserLocationOptions = {}
): UserLocationState {
  const { autoRequest = false, timeoutMs = GEOLOCATION_TIMEOUT_MS, onFallback } =
    options;

  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [permissionState, setPermissionState] =
    useState<GeolocationPermissionState>("prompt");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallbackActive, setIsFallbackActive] = useState<boolean>(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedBarangay, setSelectedBarangay] = useState<string | null>(null);

  const onFallbackRef = useRef(onFallback);
  onFallbackRef.current = onFallback;

  // Handle fallback activation without intrusive dialogs (BR-004)
  const triggerFallback = useCallback((reason: string) => {
    setIsFallbackActive(true);
    setError(reason);
    onFallbackRef.current?.();
  }, []);

  const requestLocation = useCallback(async (): Promise<Coordinates | null> => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setPermissionState("unavailable");
      triggerFallback("Browser geolocation is not supported or available.");
      return null;
    }

    setIsLoading(true);
    setError(null);

    return new Promise<Coordinates | null>((resolve) => {
      let isTimedOut = false;

      // Ensure explicit 5000ms safety timer in case browser does not honor timeout
      const safetyTimer = setTimeout(() => {
        isTimedOut = true;
        setPermissionState("timeout");
        setIsLoading(false);
        triggerFallback("Geolocation request timed out after 5 seconds.");
        resolve(null);
      }, timeoutMs);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isTimedOut) return;
          clearTimeout(safetyTimer);

          const coords: Coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCoordinates(coords);
          setPermissionState("granted");
          setIsFallbackActive(false);
          setIsLoading(false);
          setError(null);
          resolve(coords);
        },
        (geoError) => {
          if (isTimedOut) return;
          clearTimeout(safetyTimer);
          setIsLoading(false);

          let state: GeolocationPermissionState = "unavailable";
          let message = "Unable to retrieve user location.";

          // GeolocationPositionError codes:
          // 1 = PERMISSION_DENIED
          // 2 = POSITION_UNAVAILABLE
          // 3 = TIMEOUT
          if (geoError.code === 1) {
            state = "denied";
            message = "Geolocation permission was denied.";
          } else if (geoError.code === 3) {
            state = "timeout";
            message = "Geolocation request timed out.";
          } else {
            state = "unavailable";
            message = geoError.message || "Position unavailable.";
          }

          setPermissionState(state);
          triggerFallback(message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: 60000,
        }
      );
    });
  }, [timeoutMs, triggerFallback]);

  // Monitor Permissions API if available
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("permissions" in navigator) ||
      !navigator.permissions.query
    ) {
      return;
    }

    let isMounted = true;

    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (!isMounted) return;

        const updateStatus = () => {
          if (status.state === "granted") {
            setPermissionState("granted");
          } else if (status.state === "denied") {
            setPermissionState("denied");
            triggerFallback("Geolocation permission is denied.");
          } else {
            setPermissionState("prompt");
          }
        };

        updateStatus();
        status.onchange = updateStatus;
      })
      .catch(() => {
        // Permissions API error or unsupported query name
      });

    return () => {
      isMounted = false;
    };
  }, [triggerFallback]);

  // Auto-request location if option is enabled
  useEffect(() => {
    if (autoRequest) {
      requestLocation();
    }
  }, [autoRequest, requestLocation]);

  // Manual area entry fallback handler (F-006 / BR-004)
  const setManualLocation = useCallback(
    (city: string, barangay?: string, coords?: Coordinates | null) => {
      setSelectedCity(city);
      setSelectedBarangay(barangay ?? null);
      setIsFallbackActive(false);
      setError(null);

      // If explicit coordinates provided, use them; otherwise try known centroid
      if (coords) {
        setCoordinates(coords);
      } else if (NCR_CITY_CENTROIDS[city]) {
        setCoordinates(NCR_CITY_CENTROIDS[city]);
      }
    },
    []
  );

  const clearManualLocation = useCallback(() => {
    setSelectedCity(null);
    setSelectedBarangay(null);
    setCoordinates(null);
    setIsFallbackActive(false);
  }, []);

  return {
    coordinates,
    permissionState,
    isLoading,
    error,
    isFallbackActive,
    selectedCity,
    selectedBarangay,
    requestLocation,
    setManualLocation,
    clearManualLocation,
  };
}
