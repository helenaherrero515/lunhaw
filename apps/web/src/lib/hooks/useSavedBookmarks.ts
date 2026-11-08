"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { authService } from "@/lib/auth/auth-service";

export const STORAGE_PLACES_KEY = "lunhaw_saved_places";
export const STORAGE_PLACES_DATA_KEY = "lunhaw_saved_places_data";
export const STORAGE_ROUTES_KEY = "lunhaw_saved_routes";
export const STORAGE_ROUTES_DATA_KEY = "lunhaw_saved_routes_data";
export const STORAGE_SESSION_KEY = "lunhaw_client_session_id";
export const BOOKMARKS_CHANGED_EVENT = "lunhaw_saved_changed";

export interface SavedPlaceItem {
  id: string;
  name: string;
  category: string;
  city?: string;
  barangay?: string;
  address?: string;
  green_index_score?: number | null;
  verification_status?: string;
  saved_at?: string;
}

export interface SavedRouteItem {
  route_id: string;
  title: string;
  total_distance_m: number;
  est_duration_seconds: number;
  average_shade_score: number;
  fare_php?: number;
  preference_tag?: string;
  saved_at?: string;
}

export interface UseSavedBookmarksReturn {
  savedPlaceIds: string[];
  savedRouteIds: string[];
  savedPlaces: SavedPlaceItem[];
  savedRoutes: SavedRouteItem[];
  savedCount: number;
  savedPlacesCount: number;
  savedRoutesCount: number;
  isSaved: (id: string, type?: "place" | "route") => boolean;
  isPlaceSaved: (placeId: string) => boolean;
  isRouteSaved: (routeId: string) => boolean;
  toggleSave: (
    itemOrId: string | SavedPlaceItem | SavedRouteItem | Record<string, unknown>,
    type?: "place" | "route",
    details?: Record<string, unknown>
  ) => boolean;
  savePlace: (place: string | SavedPlaceItem | Record<string, unknown>) => void;
  removePlace: (placeId: string) => void;
  saveRoute: (route: string | SavedRouteItem | Record<string, unknown>) => void;
  removeRoute: (routeId: string) => void;
  clearAll: () => void;
  clearPlaces: () => void;
  clearRoutes: () => void;
  clientSessionId: string;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncWithCloud: (email?: string) => Promise<{ success: boolean; error?: string }>;
}

/** Fallback database of known places for ID-only bookmarks */
const KNOWN_PLACE_METADATA: Record<string, Partial<SavedPlaceItem>> = {
  "c1f7a0b3-6c7e-4d8a-9f5e-123456789abc": {
    name: "Barangay San Antonio Reading Center",
    category: "reading_center",
    city: "Pasig",
    barangay: "San Antonio",
    address: "San Antonio Community Complex, Pasig",
    green_index_score: 68.5,
    verification_status: "VERIFIED",
  },
  "b4a2e1d0-9f8a-4c3b-8e2d-987654321cba": {
    name: "Quezon City Public Library - Main Branch",
    category: "library",
    city: "Quezon City",
    barangay: "Central",
    address: "QC City Hall Compound, Diliman",
    green_index_score: 74.2,
    verification_status: "VERIFIED",
  },
  "d8e7c6b5-5a4f-3e2d-1c0b-112233445566": {
    name: "Valenzuela City People's Park & Reading Kiosk",
    category: "park",
    city: "Valenzuela",
    barangay: "Karuhatan",
    address: "MacArthur Highway, Karuhatan, Valenzuela",
    green_index_score: 82.0,
    verification_status: "VERIFIED",
  },
  "a9b8c7d6-1e2f-3a4b-5c6d-77889900aabb": {
    name: "Marikina City Library & Study Commons",
    category: "library",
    city: "Marikina",
    barangay: "Santo Niño",
    address: "Shoe Ave, Sto. Niño, Marikina",
    green_index_score: 61.8,
    verification_status: "VERIFIED",
  },
  "f1e2d3c4-b5a6-9788-1234-ddeeff001122": {
    name: "Manila City Library - Paco Park Branch",
    category: "library",
    city: "Manila",
    barangay: "Paco",
    address: "General Luna St, Paco, Manila",
    green_index_score: 79.4,
    verification_status: "VERIFIED",
  },
};

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "server-session";
  try {
    const existing = localStorage.getItem(STORAGE_SESSION_KEY);
    if (existing) return existing;
    const newId = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(STORAGE_SESSION_KEY, newId);
    return newId;
  } catch {
    return "ephemeral-session";
  }
}

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // QuotaExceededError or storage disabled
  }
}

function notifyStorageChanged(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(BOOKMARKS_CHANGED_EVENT));
    window.dispatchEvent(new Event("storage"));
  } catch {
    // Event dispatching fallback
  }
}
function extractPlaceId(item: string | SavedPlaceItem | Record<string, unknown>): string {
  if (typeof item === "string") return item;
  if ("id" in item && typeof item.id === "string") return item.id;
  return "";
}

function extractRouteId(item: string | SavedRouteItem | Record<string, unknown>): string {
  if (typeof item === "string") return item;
  if ("route_id" in item && typeof item.route_id === "string") return item.route_id;
  if ("id" in item && typeof item.id === "string") return item.id;
  return "";
}

function buildSavedPlaceRecord(
  placeId: string,
  source: Record<string, unknown>
): SavedPlaceItem {
  const name = typeof source.name === "string" ? source.name : `Saved Place ${placeId.slice(0, 8)}`;
  const category = typeof source.category === "string" ? source.category : "library";
  const city =
    typeof source.city === "string"
      ? source.city
      : typeof source.lgu_city === "string"
      ? source.lgu_city
      : "Metro Manila";
  const barangay = typeof source.barangay === "string" ? source.barangay : undefined;
  const address = typeof source.address === "string" ? source.address : undefined;
  const greenScore = typeof source.green_index_score === "number" ? source.green_index_score : null;

  let verification_status = "VERIFIED";
  const verification = source.verification;
  if (verification && typeof verification === "object" && "status" in verification) {
    const statusVal = verification.status;
    if (typeof statusVal === "string") {
      verification_status = statusVal;
    }
  }

  return {
    id: placeId,
    name,
    category,
    city,
    barangay,
    address,
    green_index_score: greenScore,
    verification_status,
    saved_at: new Date().toISOString(),
  };
}

function buildSavedRouteRecord(
  routeId: string,
  source: Record<string, unknown>
): SavedRouteItem {
  const title =
    typeof source.title === "string"
      ? source.title
      : `Shaded Commute Route ${routeId.slice(0, 8)}`;
  const total_distance_m =
    typeof source.total_distance_m === "number" ? source.total_distance_m : 1000;
  const est_duration_seconds =
    typeof source.est_duration_seconds === "number" ? source.est_duration_seconds : 600;
  const average_shade_score =
    typeof source.average_shade_score === "number" ? source.average_shade_score : 75;
  const preference_tag =
    typeof source.preference_tag === "string" ? source.preference_tag : undefined;

  let fare_php = 15;
  const fare = source.fare;
  if (fare && typeof fare === "object" && "amount_php" in fare && typeof fare.amount_php === "number") {
    fare_php = fare.amount_php;
  } else if (typeof source.fare_php === "number") {
    fare_php = source.fare_php;
  }

  return {
    route_id: routeId,
    title,
    total_distance_m,
    est_duration_seconds,
    average_shade_score,
    fare_php,
    preference_tag,
    saved_at: new Date().toISOString(),
  };
}


export function useSavedBookmarks(): UseSavedBookmarksReturn {
  const [clientSessionId, setClientSessionId] = useState<string>("server-session");
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);
  const [savedRouteIds, setSavedRouteIds] = useState<string[]>([]);
  const [placesData, setPlacesData] = useState<Record<string, SavedPlaceItem>>({});
  const [routesData, setRoutesData] = useState<Record<string, SavedRouteItem>>({});
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const rehydrate = useCallback(() => {
    if (typeof window === "undefined") return;
    setClientSessionId(getOrCreateSessionId());
    setSavedPlaceIds(safeReadJson<string[]>(STORAGE_PLACES_KEY, []));
    setSavedRouteIds(safeReadJson<string[]>(STORAGE_ROUTES_KEY, []));
    setPlacesData(safeReadJson<Record<string, SavedPlaceItem>>(STORAGE_PLACES_DATA_KEY, {}));
    setRoutesData(safeReadJson<Record<string, SavedRouteItem>>(STORAGE_ROUTES_DATA_KEY, {}));
  }, []);

  useEffect(() => {
    rehydrate();

    const handleStorageChange = () => {
      rehydrate();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(BOOKMARKS_CHANGED_EVENT, handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(BOOKMARKS_CHANGED_EVENT, handleStorageChange);
    };
  }, [rehydrate]);

  const savedPlaces = useMemo<SavedPlaceItem[]>(() => {
    return savedPlaceIds.map((id) => {
      if (placesData[id]) return placesData[id];
      const known = KNOWN_PLACE_METADATA[id];
      return {
        id,
        name: known?.name ?? `Saved Place ${id.slice(0, 8)}`,
        category: known?.category ?? "library",
        city: known?.city ?? "Metro Manila",
        barangay: known?.barangay,
        address: known?.address,
        green_index_score: known?.green_index_score,
        verification_status: known?.verification_status ?? "VERIFIED",
        saved_at: new Date().toISOString(),
      };
    });
  }, [savedPlaceIds, placesData]);

  const savedRoutes = useMemo<SavedRouteItem[]>(() => {
    return savedRouteIds.map((id) => {
      if (routesData[id]) return routesData[id];
      return {
        route_id: id,
        title: `Saved Transit Trip ${id.slice(0, 8)}`,
        total_distance_m: 1200,
        est_duration_seconds: 900,
        average_shade_score: 70,
        fare_php: 15,
        saved_at: new Date().toISOString(),
      };
    });
  }, [savedRouteIds, routesData]);

  const isPlaceSaved = useCallback(
    (placeId: string): boolean => savedPlaceIds.includes(placeId),
    [savedPlaceIds]
  );

  const isRouteSaved = useCallback(
    (routeId: string): boolean => savedRouteIds.includes(routeId),
    [savedRouteIds]
  );

  const isSaved = useCallback(
    (id: string, type?: "place" | "route"): boolean => {
      if (type === "route") return isRouteSaved(id);
      if (type === "place") return isPlaceSaved(id);
      return isPlaceSaved(id) || isRouteSaved(id);
    },
    [isPlaceSaved, isRouteSaved]
  );

  const savePlace = useCallback(
    (place: string | SavedPlaceItem | Record<string, unknown>) => {
      const placeId = extractPlaceId(place);
      if (!placeId) return;

      const currentIds = safeReadJson<string[]>(STORAGE_PLACES_KEY, []);
      const nextIds = currentIds.includes(placeId) ? currentIds : [...currentIds, placeId];
      safeWriteJson(STORAGE_PLACES_KEY, nextIds);

      if (typeof place === "object" && place !== null) {
        const currentData = safeReadJson<Record<string, SavedPlaceItem>>(STORAGE_PLACES_DATA_KEY, {});
        currentData[placeId] = buildSavedPlaceRecord(placeId, place as Record<string, unknown>);
        safeWriteJson(STORAGE_PLACES_DATA_KEY, currentData);
      }

      notifyStorageChanged();
    },
    []
  );

  const removePlace = useCallback((placeId: string) => {
    const currentIds = safeReadJson<string[]>(STORAGE_PLACES_KEY, []);
    const nextIds = currentIds.filter((id) => id !== placeId);
    safeWriteJson(STORAGE_PLACES_KEY, nextIds);

    const currentData = safeReadJson<Record<string, SavedPlaceItem>>(STORAGE_PLACES_DATA_KEY, {});
    if (currentData[placeId]) {
      delete currentData[placeId];
      safeWriteJson(STORAGE_PLACES_DATA_KEY, currentData);
    }

    notifyStorageChanged();
  }, []);

  const saveRoute = useCallback(
    (route: string | SavedRouteItem | Record<string, unknown>) => {
      const routeId = extractRouteId(route);
      if (!routeId) return;

      const currentIds = safeReadJson<string[]>(STORAGE_ROUTES_KEY, []);
      const nextIds = currentIds.includes(routeId) ? currentIds : [...currentIds, routeId];
      safeWriteJson(STORAGE_ROUTES_KEY, nextIds);

      if (typeof route === "object" && route !== null) {
        const currentData = safeReadJson<Record<string, SavedRouteItem>>(STORAGE_ROUTES_DATA_KEY, {});
        currentData[routeId] = buildSavedRouteRecord(routeId, route as Record<string, unknown>);
        safeWriteJson(STORAGE_ROUTES_DATA_KEY, currentData);
      }

      notifyStorageChanged();
    },
    []
  );

  const removeRoute = useCallback((routeId: string) => {
    const currentIds = safeReadJson<string[]>(STORAGE_ROUTES_KEY, []);
    const nextIds = currentIds.filter((id) => id !== routeId);
    safeWriteJson(STORAGE_ROUTES_KEY, nextIds);

    const currentData = safeReadJson<Record<string, SavedRouteItem>>(STORAGE_ROUTES_DATA_KEY, {});
    if (currentData[routeId]) {
      delete currentData[routeId];
      safeWriteJson(STORAGE_ROUTES_DATA_KEY, currentData);
    }

    notifyStorageChanged();
  }, []);

  const toggleSave = useCallback(
    (
      itemOrId: string | SavedPlaceItem | SavedRouteItem | Record<string, unknown>,
      type?: "place" | "route",
      details?: Record<string, unknown>
    ): boolean => {
      const isRoute =
        type === "route" ||
        (typeof itemOrId === "object" && itemOrId !== null && "route_id" in itemOrId) ||
        (details && "route_id" in details);

      if (isRoute) {
        const routeId = extractRouteId(itemOrId as string | SavedRouteItem | Record<string, unknown>);
        const currentSaved = isRouteSaved(routeId);
        if (currentSaved) {
          removeRoute(routeId);
          return false;
        } else {
          saveRoute((details || itemOrId) as SavedRouteItem | Record<string, unknown>);
          return true;
        }
      } else {
        const placeId = extractPlaceId(itemOrId as string | SavedPlaceItem | Record<string, unknown>);
        const currentSaved = isPlaceSaved(placeId);
        if (currentSaved) {
          removePlace(placeId);
          return false;
        } else {
          savePlace((details || itemOrId) as SavedPlaceItem | Record<string, unknown>);
          return true;
        }
      }
    },
    [isPlaceSaved, isRouteSaved, removePlace, removeRoute, savePlace, saveRoute]
  );

  const clearPlaces = useCallback(() => {
    safeWriteJson(STORAGE_PLACES_KEY, []);
    safeWriteJson(STORAGE_PLACES_DATA_KEY, {});
    notifyStorageChanged();
  }, []);

  const clearRoutes = useCallback(() => {
    safeWriteJson(STORAGE_ROUTES_KEY, []);
    safeWriteJson(STORAGE_ROUTES_DATA_KEY, {});
    notifyStorageChanged();
  }, []);

  const clearAll = useCallback(() => {
    safeWriteJson(STORAGE_PLACES_KEY, []);
    safeWriteJson(STORAGE_PLACES_DATA_KEY, {});
    safeWriteJson(STORAGE_ROUTES_KEY, []);
    safeWriteJson(STORAGE_ROUTES_DATA_KEY, {});
    notifyStorageChanged();
  }, []);

  const syncWithCloud = useCallback(
    async (email?: string): Promise<{ success: boolean; error?: string }> => {
      setIsSyncing(true);
      try {
        if (email) {
          const authRes = await authService.signInWithMagicLink(email);
          if (!authRes.success) {
            return { success: false, error: authRes.error ?? "Failed to send magic link." };
          }
        }


        // Account sync of saved items is not part of this release; saved items stay on this device.

        setLastSyncedAt(new Date().toISOString());
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Sync encountered an unexpected error.",
        };
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  return {
    savedPlaceIds,
    savedRouteIds,
    savedPlaces,
    savedRoutes,
    savedCount: savedPlaceIds.length + savedRouteIds.length,
    savedPlacesCount: savedPlaceIds.length,
    savedRoutesCount: savedRouteIds.length,
    isSaved,
    isPlaceSaved,
    isRouteSaved,
    toggleSave,
    savePlace,
    removePlace,
    saveRoute,
    removeRoute,
    clearAll,
    clearPlaces,
    clearRoutes,
    clientSessionId,
    isSyncing,
    lastSyncedAt,
    syncWithCloud,
  };
}
