import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, renderHook, act, waitFor, within } from "@testing-library/react";
import {
  useUserLocation,
  NCR_CITY_CENTROIDS,
  type GeolocationPermissionState,
} from "@/lib/hooks/useUserLocation";
import {
  LGUSelectorModal,
  METRO_MANILA_LGUS,
} from "@/components/location/LGUSelectorModal";
import { ExploreView } from "@/components/explore/ExploreView";

describe("E-M1-03 / TC-006: Geolocation Fallback & Manual LGU Selector (BR-004 / F-006)", () => {
  const originalGeolocation = navigator.geolocation;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "geolocation", {
      value: originalGeolocation,
      configurable: true,
      writable: true,
    });
  });

  describe("useUserLocation Hook Fallback Handling (C-M1-01 / BR-004)", () => {
    it("transitions gracefully to 'denied' and triggers fallback when permission is denied (code 1)", async () => {
      const mockGetCurrentPosition = vi.fn((_success, error) => {
        error({
          code: 1, // PERMISSION_DENIED
          message: "User denied Geolocation",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      });

      Object.defineProperty(navigator, "geolocation", {
        value: {
          getCurrentPosition: mockGetCurrentPosition,
          watchPosition: vi.fn(),
          clearWatch: vi.fn(),
        },
        configurable: true,
        writable: true,
      });

      const onFallback = vi.fn();
      const { result } = renderHook(() =>
        useUserLocation({ autoRequest: false, onFallback })
      );

      expect(result.current.permissionState).toBe("prompt");
      expect(result.current.isFallbackActive).toBe(false);

      let coordsResult = null;
      await act(async () => {
        coordsResult = await result.current.requestLocation();
      });

      expect(coordsResult).toBeNull();
      expect(result.current.permissionState).toBe("denied");
      expect(result.current.isFallbackActive).toBe(true);
      expect(result.current.error).toContain("denied");
      expect(onFallback).toHaveBeenCalledTimes(1);
    });

    it("transitions to 'timeout' and triggers fallback when location times out (code 3)", async () => {
      const mockGetCurrentPosition = vi.fn((_success, error) => {
        error({
          code: 3, // TIMEOUT
          message: "Geolocation request timed out",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      });

      Object.defineProperty(navigator, "geolocation", {
        value: {
          getCurrentPosition: mockGetCurrentPosition,
          watchPosition: vi.fn(),
          clearWatch: vi.fn(),
        },
        configurable: true,
        writable: true,
      });

      const onFallback = vi.fn();
      const { result } = renderHook(() =>
        useUserLocation({ autoRequest: false, onFallback })
      );

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(result.current.permissionState).toBe("timeout");
      expect(result.current.isFallbackActive).toBe(true);
      expect(result.current.error).toContain("timed out");
      expect(onFallback).toHaveBeenCalledTimes(1);
    });

    it("handles missing browser geolocation support gracefully as 'unavailable'", async () => {
      Object.defineProperty(navigator, "geolocation", {
        value: undefined,
        configurable: true,
        writable: true,
      });

      const onFallback = vi.fn();
      const { result } = renderHook(() =>
        useUserLocation({ autoRequest: false, onFallback })
      );

      await act(async () => {
        const coords = await result.current.requestLocation();
        expect(coords).toBeNull();
      });

      expect(result.current.permissionState).toBe("unavailable");
      expect(result.current.isFallbackActive).toBe(true);
      expect(onFallback).toHaveBeenCalledTimes(1);
    });

    it("successfully updates manual location using NCR city centroids", () => {
      const { result } = renderHook(() => useUserLocation());

      act(() => {
        result.current.setManualLocation("Pasig", "San Antonio");
      });

      expect(result.current.selectedCity).toBe("Pasig");
      expect(result.current.selectedBarangay).toBe("San Antonio");
      expect(result.current.coordinates).toEqual(NCR_CITY_CENTROIDS["Pasig"]);
      expect(result.current.isFallbackActive).toBe(false);

      // Clearing manual location
      act(() => {
        result.current.clearManualLocation();
      });

      expect(result.current.selectedCity).toBeNull();
      expect(result.current.selectedBarangay).toBeNull();
      expect(result.current.coordinates).toBeNull();
    });

    it("populates coordinates and keeps fallback false when permission is granted", async () => {
      const mockCoords = { latitude: 14.5828, longitude: 120.9822 };
      const mockGetCurrentPosition = vi.fn((success) => {
        success({
          coords: mockCoords,
          timestamp: Date.now(),
        });
      });

      Object.defineProperty(navigator, "geolocation", {
        value: {
          getCurrentPosition: mockGetCurrentPosition,
          watchPosition: vi.fn(),
          clearWatch: vi.fn(),
        },
        configurable: true,
        writable: true,
      });

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        const coords = await result.current.requestLocation();
        expect(coords).toEqual({ lat: 14.5828, lng: 120.9822 });
      });

      expect(result.current.permissionState).toBe("granted");
      expect(result.current.isFallbackActive).toBe(false);
      expect(result.current.coordinates).toEqual({ lat: 14.5828, lng: 120.9822 });
    });
  });

  describe("LGUSelectorModal Component (C-M1-02 / F-006)", () => {
    it("renders accessible modal with all 17 Metro Manila LGUs", () => {
      render(
        <LGUSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          onSelectLocation={vi.fn()}
        />
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-modal", "true");

      // Verify header and description
      expect(
        screen.getByText("Select Area in Metro Manila")
      ).toBeInTheDocument();

      // Ensure all 17 LGUs are defined in METRO_MANILA_LGUS
      expect(METRO_MANILA_LGUS.length).toBe(17);

      // Verify representative LGUs are listed in the modal
      const expectedCities = [
        "Manila",
        "Quezon City",
        "Caloocan",
        "Las Piñas",
        "Makati",
        "Malabon",
        "Mandaluyong",
        "Marikina",
        "Muntinlupa",
        "Navotas",
        "Parañaque",
        "Pasay",
        "Pasig",
        "Pateros",
        "San Juan",
        "Taguig",
        "Valenzuela",
      ];

      for (const cityName of expectedCities) {
        expect(screen.getByText(cityName)).toBeInTheDocument();
      }
    });

    it("filters cities via the city search input", () => {
      render(
        <LGUSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          onSelectLocation={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search city/i);
      fireEvent.change(searchInput, { target: { value: "Pasig" } });

      // Pasig should be visible
      expect(screen.getByText("Pasig")).toBeInTheDocument();

      // Other cities should be filtered out
      expect(screen.queryByText("Valenzuela")).not.toBeInTheDocument();
      expect(screen.queryByText("Muntinlupa")).not.toBeInTheDocument();
    });

    it("populates barangays upon selecting a city and permits selecting a barangay", () => {
      const onSelectLocation = vi.fn();
      render(
        <LGUSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          onSelectLocation={onSelectLocation}
        />
      );

      // Click on Pasig city button
      const pasigButton = screen.getByText("Pasig");
      fireEvent.click(pasigButton);

      // Should display barangays section
      expect(screen.getAllByText(/Barangays in Pasig/i)[0]).toBeInTheDocument();

      // Should display Pasig barangays like San Antonio
      const barangaysList = screen.getByRole("listbox", { name: /Barangays in Pasig/i });
      const sanAntonioBtn = within(barangaysList).getByText("San Antonio");
      expect(sanAntonioBtn).toBeInTheDocument();
      fireEvent.click(sanAntonioBtn);

      // Click confirm location button
      const confirmButton = screen.getByRole("button", {
        name: /confirm location/i,
      });
      fireEvent.click(confirmButton);

      expect(onSelectLocation).toHaveBeenCalledWith(
        expect.objectContaining({
          city: "Pasig",
          barangay: "San Antonio",
        })
      );
    });

    it("dismisses the modal when Escape key is pressed", () => {
      const onClose = vi.fn();
      render(
        <LGUSelectorModal
          isOpen={true}
          onClose={onClose}
          onSelectLocation={vi.fn()}
        />
      );

      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not render modal contents when isOpen is false", () => {
      render(
        <LGUSelectorModal
          isOpen={false}
          onClose={vi.fn()}
          onSelectLocation={vi.fn()}
        />
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Integration in ExploreView (BR-004 Non-blocking Fallback)", () => {
    it("renders ExploreView without blocking and allows opening manual LGU selector", () => {
      render(<ExploreView />);

      // Search bar and category pills should be interactive
      expect(
        screen.getByPlaceholderText(/search parks, libraries, barangays/i)
      ).toBeInTheDocument();
      expect(screen.getByText("All Spaces")).toBeInTheDocument();
      expect(screen.getByText("Libraries & Study")).toBeInTheDocument();

      // Find and click the manual location selector button (trigger for LGU modal)
      const locationTrigger = screen.getByRole("button", {
        name: /choose metro manila city or barangay/i,
      });
      expect(locationTrigger).toBeInTheDocument();
      fireEvent.click(locationTrigger);

      // LGUSelectorModal should open seamlessly
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Select Area in Metro Manila")).toBeInTheDocument();
    });
  });
});
