import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, renderHook, act, waitFor } from "@testing-library/react";
import {
  useSavedBookmarks,
  STORAGE_PLACES_KEY,
  STORAGE_PLACES_DATA_KEY,
  STORAGE_ROUTES_KEY,
  STORAGE_ROUTES_DATA_KEY,
  STORAGE_SESSION_KEY,
  BOOKMARKS_CHANGED_EVENT,
  type SavedPlaceItem,
  type SavedRouteItem,
} from "@/lib/hooks/useSavedBookmarks";
import { SavedItemsDrawer } from "@/components/saved/SavedItemsDrawer";
import { FacilityProfile } from "@/components/places/FacilityProfile";
import { useLunhawStore } from "@/lib/store/use-lunhaw-store";
import type { FacilityDetail } from "@/types/places";

/**
 * E-M3-01 / TC-005: Local Storage Persistence & Session Isolation Tests
 * Traces to: F-005, TC-005, UJ-001, UJ-002
 *
 * Invariants Tested:
 * 1. Saved places and routes persist across browser unmount/remount (simulated reload).
 * 2. Cross-tab storage synchronization updates reactive state on storage events.
 * 3. Client session isolation: Distinct pseudonymous client sessions isolate bookmarks.
 * 4. SavedItemsDrawer integration: UI reflects persistent saves, tabs, removes, and clear-all.
 * 5. Corruption resistance: Invalid localStorage JSON falls back gracefully without crash.
 */

const MOCK_PLACE_1: SavedPlaceItem = {
  id: "f0010000-0000-0000-0000-000000000001",
  name: "National Library of the Philippines (NLP) - Main Complex",
  category: "library",
  city: "Manila",
  barangay: "Barangay 666",
  address: "T.M. Kalaw St, Ermita, Manila",
  green_index_score: 74.2,
  verification_status: "VERIFIED",
};

const MOCK_PLACE_2: SavedPlaceItem = {
  id: "f0010000-0000-0000-0000-000000000002",
  name: "Quezon City Public Library - Main Branch",
  category: "library",
  city: "Quezon City",
  barangay: "Central",
  address: "City Hall Compound, Diliman",
  green_index_score: 81.5,
  verification_status: "VERIFIED",
};

const MOCK_ROUTE_1: SavedRouteItem = {
  route_id: "r0010000-0000-0000-0000-000000000001",
  title: "EDSA Carousel to Ayala Triangle Shaded Walk",
  total_distance_m: 1450,
  est_duration_seconds: 1100,
  average_shade_score: 82.0,
  fare_php: 15.0,
  preference_tag: "high_shade",
};

const MOCK_FACILITY_DETAIL: FacilityDetail = {
  id: MOCK_PLACE_1.id,
  name: MOCK_PLACE_1.name,
  category: "library",
  description: "Public library facility with reading hall",
  city: "Manila",
  barangay: "Barangay 666",
  address: "T.M. Kalaw St, Ermita, Manila",
  coordinates: { lat: 14.5828, lng: 120.9822 },
  green_index_score: 74.2,
  verification: {
    status: "VERIFIED",
    official_source_name: "NLP",
    last_verified_at: "2026-10-15T08:00:00Z",
  },
  study_amenities: {
    desk_capacity: 120,
    has_power_outlets: true,
    has_wifi: true,
    has_aircon: true,
    has_quiet_zone: true,
    is_free_to_use: true,
    verification: { status: "VERIFIED" },
    amenity_verifications: {
      desk_capacity: { status: "VERIFIED" },
      has_power_outlets: { status: "VERIFIED" },
      has_wifi: { status: "VERIFIED" },
      has_aircon: { status: "VERIFIED" },
      has_quiet_zone: { status: "VERIFIED" },
      is_free_to_use: { status: "VERIFIED" },
    },
  },
};

describe("E-M3-01 / TC-005: Saved Bookmarks Persistence & Session Isolation", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useLunhawStore.setState({ isSavedDrawerOpen: false });
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Persistence Across Reloads (TC-005)
  // =========================================================================
  describe("1. Persistence Across Page Reloads", () => {
    it("persists saved places in localStorage and restores them upon hook remount", () => {
      // Step 1: Initial mount - save Place 1
      const { result, unmount } = renderHook(() => useSavedBookmarks());

      expect(result.current.savedCount).toBe(0);
      expect(result.current.isSaved(MOCK_PLACE_1.id)).toBe(false);

      act(() => {
        result.current.savePlace(MOCK_PLACE_1);
      });

      expect(result.current.savedCount).toBe(1);
      expect(result.current.savedPlacesCount).toBe(1);
      expect(result.current.isSaved(MOCK_PLACE_1.id)).toBe(true);

      // Verify raw localStorage values
      const storedIds = JSON.parse(localStorage.getItem(STORAGE_PLACES_KEY) || "[]");
      expect(storedIds).toContain(MOCK_PLACE_1.id);

      const storedData = JSON.parse(localStorage.getItem(STORAGE_PLACES_DATA_KEY) || "{}");
      expect(storedData[MOCK_PLACE_1.id]?.name).toBe(MOCK_PLACE_1.name);

      // Step 2: Simulate page reload by unmounting current instance
      unmount();

      // Step 3: Remount hook (simulated new page visit)
      const { result: remountedResult } = renderHook(() => useSavedBookmarks());

      // Assert persisted data rehydrates properly
      expect(remountedResult.current.savedCount).toBe(1);
      expect(remountedResult.current.savedPlacesCount).toBe(1);
      expect(remountedResult.current.isSaved(MOCK_PLACE_1.id)).toBe(true);
      expect(remountedResult.current.savedPlaces[0]!.name).toBe(MOCK_PLACE_1.name);
      expect(remountedResult.current.savedPlaces[0]!.city).toBe(MOCK_PLACE_1.city);
    });

    it("persists saved routes in localStorage and restores them across remounts", () => {
      const { result, unmount } = renderHook(() => useSavedBookmarks());

      act(() => {
        result.current.saveRoute(MOCK_ROUTE_1);
      });

      expect(result.current.savedRoutesCount).toBe(1);
      expect(result.current.isRouteSaved(MOCK_ROUTE_1.route_id)).toBe(true);

      const storedRouteIds = JSON.parse(localStorage.getItem(STORAGE_ROUTES_KEY) || "[]");
      expect(storedRouteIds).toContain(MOCK_ROUTE_1.route_id);

      // Simulate reload
      unmount();

      const { result: remounted } = renderHook(() => useSavedBookmarks());
      expect(remounted.current.savedRoutesCount).toBe(1);
      expect(remounted.current.isRouteSaved(MOCK_ROUTE_1.route_id)).toBe(true);
      expect(remounted.current.savedRoutes[0]!.title).toBe(MOCK_ROUTE_1.title);
      expect(remounted.current.savedRoutes[0]!.fare_php).toBe(15.0);
    });

    it("handles simultaneous places and routes and verifies aggregate savedCount", () => {
      const { result, unmount } = renderHook(() => useSavedBookmarks());

      act(() => {
        result.current.savePlace(MOCK_PLACE_1);
        result.current.savePlace(MOCK_PLACE_2);
        result.current.saveRoute(MOCK_ROUTE_1);
      });

      expect(result.current.savedCount).toBe(3);
      expect(result.current.savedPlacesCount).toBe(2);
      expect(result.current.savedRoutesCount).toBe(1);

      unmount();

      // Remount check
      const { result: reloaded } = renderHook(() => useSavedBookmarks());
      expect(reloaded.current.savedCount).toBe(3);
      expect(reloaded.current.savedPlacesCount).toBe(2);
      expect(reloaded.current.savedRoutesCount).toBe(1);
    });

    it("removes items and persists deletions across reloads", () => {
      const { result, unmount } = renderHook(() => useSavedBookmarks());

      act(() => {
        result.current.savePlace(MOCK_PLACE_1);
        result.current.savePlace(MOCK_PLACE_2);
      });
      expect(result.current.savedCount).toBe(2);

      act(() => {
        result.current.removePlace(MOCK_PLACE_1.id);
      });
      expect(result.current.savedCount).toBe(1);
      expect(result.current.isSaved(MOCK_PLACE_1.id)).toBe(false);
      expect(result.current.isSaved(MOCK_PLACE_2.id)).toBe(true);

      unmount();

      const { result: reloaded } = renderHook(() => useSavedBookmarks());
      expect(reloaded.current.savedCount).toBe(1);
      expect(reloaded.current.isSaved(MOCK_PLACE_1.id)).toBe(false);
      expect(reloaded.current.isSaved(MOCK_PLACE_2.id)).toBe(true);
    });

    it("clears all bookmarks and persists clean slate across reloads", () => {
      const { result, unmount } = renderHook(() => useSavedBookmarks());

      act(() => {
        result.current.savePlace(MOCK_PLACE_1);
        result.current.saveRoute(MOCK_ROUTE_1);
      });
      expect(result.current.savedCount).toBe(2);

      act(() => {
        result.current.clearAll();
      });
      expect(result.current.savedCount).toBe(0);

      unmount();

      const { result: reloaded } = renderHook(() => useSavedBookmarks());
      expect(reloaded.current.savedCount).toBe(0);
      expect(reloaded.current.savedPlaces).toEqual([]);
      expect(reloaded.current.savedRoutes).toEqual([]);
    });
  });

  // =========================================================================
  // 2. Client Session Isolation (TC-005)
  // =========================================================================
  describe("2. Client Session Isolation (Pseudonymous UUIDs)", () => {
    it("generates a persistent pseudonymous client_session_id in localStorage", () => {
      const { result, unmount } = renderHook(() => useSavedBookmarks());

      const sessionId1 = result.current.clientSessionId;
      expect(sessionId1).toBeDefined();
      expect(sessionId1.length).toBeGreaterThan(10);
      expect(localStorage.getItem(STORAGE_SESSION_KEY)).toBe(sessionId1);

      unmount();

      // Same client browser maintains same session ID across reloads
      const { result: remounted } = renderHook(() => useSavedBookmarks());
      expect(remounted.current.clientSessionId).toBe(sessionId1);
    });

    it("isolates bookmarks when switching client session partitions", () => {
      const SESSION_USER_A = "11111111-2222-3333-4444-555555555555";
      const SESSION_USER_B = "99999999-8888-7777-6666-555555555555";

      // 1. Client A environment setup
      localStorage.setItem(STORAGE_SESSION_KEY, SESSION_USER_A);
      const { result: hookUserA, unmount: unmountUserA } = renderHook(() => useSavedBookmarks());

      expect(hookUserA.current.clientSessionId).toBe(SESSION_USER_A);
      act(() => {
        hookUserA.current.savePlace(MOCK_PLACE_1);
      });
      expect(hookUserA.current.savedCount).toBe(1);

      // Capture User A storage partition snapshot
      const userAStorageSnapshot: Record<string, string | null> = {
        places: localStorage.getItem(STORAGE_PLACES_KEY),
        placesData: localStorage.getItem(STORAGE_PLACES_DATA_KEY),
        session: localStorage.getItem(STORAGE_SESSION_KEY),
      };
      unmountUserA();

      // 2. Client B opens the app on a fresh device / clean partition
      localStorage.clear();
      localStorage.setItem(STORAGE_SESSION_KEY, SESSION_USER_B);

      const { result: hookUserB, unmount: unmountUserB } = renderHook(() => useSavedBookmarks());
      expect(hookUserB.current.clientSessionId).toBe(SESSION_USER_B);
      // Assert Client B has zero bookmarks from Client A
      expect(hookUserB.current.savedCount).toBe(0);
      expect(hookUserB.current.isSaved(MOCK_PLACE_1.id)).toBe(false);

      // User B saves their own distinct place
      act(() => {
        hookUserB.current.savePlace(MOCK_PLACE_2);
      });
      expect(hookUserB.current.savedCount).toBe(1);
      expect(hookUserB.current.isSaved(MOCK_PLACE_2.id)).toBe(true);
      expect(hookUserB.current.isSaved(MOCK_PLACE_1.id)).toBe(false);
      unmountUserB();

      // 3. Client A returns: restore Client A's partition
      localStorage.clear();
      if (userAStorageSnapshot.places) localStorage.setItem(STORAGE_PLACES_KEY, userAStorageSnapshot.places);
      if (userAStorageSnapshot.placesData) localStorage.setItem(STORAGE_PLACES_DATA_KEY, userAStorageSnapshot.placesData);
      if (userAStorageSnapshot.session) localStorage.setItem(STORAGE_SESSION_KEY, userAStorageSnapshot.session);

      const { result: restoredUserA } = renderHook(() => useSavedBookmarks());
      expect(restoredUserA.current.clientSessionId).toBe(SESSION_USER_A);
      expect(restoredUserA.current.savedCount).toBe(1);
      expect(restoredUserA.current.isSaved(MOCK_PLACE_1.id)).toBe(true);
      expect(restoredUserA.current.isSaved(MOCK_PLACE_2.id)).toBe(false);
    });
  });

  // =========================================================================
  // 3. Cross-Tab & Custom Event Synchronization
  // =========================================================================
  describe("3. Cross-Tab Reactive Synchronization", () => {
    it("updates reactive state when window storage event fires", async () => {
      const { result } = renderHook(() => useSavedBookmarks());
      expect(result.current.savedCount).toBe(0);

      // Simulate an external tab writing to localStorage
      act(() => {
        localStorage.setItem(STORAGE_PLACES_KEY, JSON.stringify([MOCK_PLACE_1.id]));
        localStorage.setItem(
          STORAGE_PLACES_DATA_KEY,
          JSON.stringify({ [MOCK_PLACE_1.id]: MOCK_PLACE_1 })
        );
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: STORAGE_PLACES_KEY,
            newValue: JSON.stringify([MOCK_PLACE_1.id]),
          })
        );
      });

      await waitFor(() => {
        expect(result.current.savedCount).toBe(1);
        expect(result.current.isSaved(MOCK_PLACE_1.id)).toBe(true);
      });
    });

    it("syncs state on custom BOOKMARKS_CHANGED_EVENT event", async () => {
      const { result } = renderHook(() => useSavedBookmarks());
      expect(result.current.savedCount).toBe(0);

      act(() => {
        localStorage.setItem(STORAGE_ROUTES_KEY, JSON.stringify([MOCK_ROUTE_1.route_id]));
        localStorage.setItem(
          STORAGE_ROUTES_DATA_KEY,
          JSON.stringify({ [MOCK_ROUTE_1.route_id]: MOCK_ROUTE_1 })
        );
        window.dispatchEvent(new Event(BOOKMARKS_CHANGED_EVENT));
      });

      await waitFor(() => {
        expect(result.current.savedRoutesCount).toBe(1);
        expect(result.current.isRouteSaved(MOCK_ROUTE_1.route_id)).toBe(true);
      });
    });
  });

  // =========================================================================
  // 4. SavedItemsDrawer UI Integration
  // =========================================================================
  describe("4. SavedItemsDrawer Integration with Persisted Data", () => {
    it("renders empty state when no items are saved", () => {
      render(<SavedItemsDrawer isOpen={true} />);

      expect(screen.getByTestId("saved-items-drawer")).toBeInTheDocument();
      expect(screen.getByTestId("saved-items-empty")).toBeInTheDocument();
      expect(screen.getByText("No saved items yet")).toBeInTheDocument();
      expect(screen.queryByTestId("clear-all-saved-btn")).not.toBeInTheDocument();
    });

    it("renders saved places and routes in drawer with correct tabs and actions", async () => {
      // Pre-seed localStorage with places and routes
      localStorage.setItem(
        STORAGE_PLACES_KEY,
        JSON.stringify([MOCK_PLACE_1.id, MOCK_PLACE_2.id])
      );
      localStorage.setItem(
        STORAGE_PLACES_DATA_KEY,
        JSON.stringify({
          [MOCK_PLACE_1.id]: MOCK_PLACE_1,
          [MOCK_PLACE_2.id]: MOCK_PLACE_2,
        })
      );
      localStorage.setItem(STORAGE_ROUTES_KEY, JSON.stringify([MOCK_ROUTE_1.route_id]));
      localStorage.setItem(
        STORAGE_ROUTES_DATA_KEY,
        JSON.stringify({ [MOCK_ROUTE_1.route_id]: MOCK_ROUTE_1 })
      );

      const mockNavigatePlace = vi.fn();
      const mockNavigateRoute = vi.fn();

      render(
        <SavedItemsDrawer
          isOpen={true}
          onNavigateToPlace={mockNavigatePlace}
          onNavigateToRoute={mockNavigateRoute}
        />
      );

      // Verify header count
      expect(screen.getByText("3 bookmarks saved locally")).toBeInTheDocument();

      // Verify items render in 'all' tab
      expect(screen.getByTestId(`saved-place-${MOCK_PLACE_1.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`saved-place-${MOCK_PLACE_2.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`saved-route-${MOCK_ROUTE_1.route_id}`)).toBeInTheDocument();

      // Filter by 'places' tab
      fireEvent.click(screen.getByTestId("tab-places"));
      expect(screen.getByTestId(`saved-place-${MOCK_PLACE_1.id}`)).toBeInTheDocument();
      expect(screen.queryByTestId(`saved-route-${MOCK_ROUTE_1.route_id}`)).not.toBeInTheDocument();

      // Filter by 'routes' tab
      fireEvent.click(screen.getByTestId("tab-routes"));
      expect(screen.queryByTestId(`saved-place-${MOCK_PLACE_1.id}`)).not.toBeInTheDocument();
      expect(screen.getByTestId(`saved-route-${MOCK_ROUTE_1.route_id}`)).toBeInTheDocument();

      // Click navigate on route
      fireEvent.click(screen.getByTestId(`navigate-route-${MOCK_ROUTE_1.route_id}`));
      expect(mockNavigateRoute).toHaveBeenCalledWith(
        expect.objectContaining({ route_id: MOCK_ROUTE_1.route_id })
      );

      // Switch back to 'all' and remove Place 1
      fireEvent.click(screen.getByTestId("tab-all"));
      fireEvent.click(screen.getByTestId(`remove-place-${MOCK_PLACE_1.id}`));

      await waitFor(() => {
        expect(screen.queryByTestId(`saved-place-${MOCK_PLACE_1.id}`)).not.toBeInTheDocument();
      });

      // Verify deletion in localStorage
      const updatedPlaceIds = JSON.parse(localStorage.getItem(STORAGE_PLACES_KEY) || "[]");
      expect(updatedPlaceIds).not.toContain(MOCK_PLACE_1.id);
      expect(updatedPlaceIds).toContain(MOCK_PLACE_2.id);
    });

    it("triggers clear all confirmation and removes all items", async () => {
      localStorage.setItem(STORAGE_PLACES_KEY, JSON.stringify([MOCK_PLACE_1.id]));
      localStorage.setItem(
        STORAGE_PLACES_DATA_KEY,
        JSON.stringify({ [MOCK_PLACE_1.id]: MOCK_PLACE_1 })
      );

      render(<SavedItemsDrawer isOpen={true} />);

      expect(screen.getByTestId(`saved-place-${MOCK_PLACE_1.id}`)).toBeInTheDocument();

      // Click Clear all
      fireEvent.click(screen.getByTestId("clear-all-saved-btn"));

      // Confirmation prompt appears
      expect(screen.getByText("Remove all 1 saved items?")).toBeInTheDocument();

      // Confirm
      const confirmBtn = screen.getByRole("button", { name: /Confirm/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByTestId("saved-items-empty")).toBeInTheDocument();
      });

      expect(JSON.parse(localStorage.getItem(STORAGE_PLACES_KEY) || "[]")).toEqual([]);
    });
  });

  // =========================================================================
  // 5. FacilityProfile Bookmark Button Integration
  // =========================================================================
  describe("5. FacilityProfile Save Button Integration", () => {
    it("toggles bookmark status and syncs with localStorage", async () => {
      const handleToggle = vi.fn();
      render(<FacilityProfile facility={MOCK_FACILITY_DETAIL} onToggleSave={handleToggle} />);

      const saveButton = screen.getByRole("button", { name: "Save facility" });
      expect(saveButton).toHaveAttribute("aria-pressed", "false");

      // Click save
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(saveButton).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByText("Saved")).toBeInTheDocument();
      });

      expect(handleToggle).toHaveBeenCalledWith(MOCK_FACILITY_DETAIL.id, true);

      // Verify in localStorage
      const stored = JSON.parse(localStorage.getItem(STORAGE_PLACES_KEY) || "[]");
      expect(stored).toContain(MOCK_FACILITY_DETAIL.id);

      // Click again to unsave
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(saveButton).toHaveAttribute("aria-pressed", "false");
        expect(screen.getByText("Save")).toBeInTheDocument();
      });

      expect(handleToggle).toHaveBeenCalledWith(MOCK_FACILITY_DETAIL.id, false);
      const afterUnsave = JSON.parse(localStorage.getItem(STORAGE_PLACES_KEY) || "[]");
      expect(afterUnsave).not.toContain(MOCK_FACILITY_DETAIL.id);
    });
  });

  // =========================================================================
  // 6. Quota and Storage Corruption Resilience
  // =========================================================================
  describe("6. Storage Corruption & Quota Resilience", () => {
    it("handles corrupt non-JSON localStorage entries without crashing", () => {
      localStorage.setItem(STORAGE_PLACES_KEY, "invalid-non-json{{{[");
      localStorage.setItem(STORAGE_PLACES_DATA_KEY, "{corrupted-object");

      const { result } = renderHook(() => useSavedBookmarks());

      // Does not crash, defaults to clean state
      expect(result.current.savedPlaceIds).toEqual([]);
      expect(result.current.savedPlaces).toEqual([]);
      expect(result.current.savedCount).toBe(0);
    });
  });
});
