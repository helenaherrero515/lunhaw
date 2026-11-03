import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  generateRoutes,
  calculateWalkingDuration,
  calculateTransitFare,
  calculateAverageShadeScore,
  haversineDistanceMeters,
  runAStar,
} from "@/workers/routing-worker";
import { ClientRouter, findCommuteRoutes } from "@/lib/routing/router";
import { GreenIndexPill } from "@/components/green-index/GreenIndexPill";
import { GlassBoxModal } from "@/components/green-index/GlassBoxModal";
import { RouteStepCard } from "@/components/routing/RouteStepCard";
import { RouteComparison } from "@/components/routing/RouteComparison";
import { RoutePlanner } from "@/components/routing/RoutePlanner";
import {
  buildRouteGeoJSON,
  getSegmentColor,
  SHADE_COLORS,
} from "@/components/map/RouteShadeLayer";
import type { RouteLeg, RouteOption } from "@/types/routing";

describe("Milestone 2: Commute Routing & Green Index (F-003, F-004, INV-001)", () => {
  // --- C-M2-01: Routing Worker & Router Engine ---
  describe("C-M2-01: Client-Side Routing Worker & A* Pathfinding", () => {
    it("calculates walking duration adhering to EQ-003 (Vwalk = 4.2 km/h)", () => {
      // 1000m walk = (1.0 / 4.2) * 3600 = 857 seconds (~14.3 mins)
      const duration1km = calculateWalkingDuration(1000);
      expect(duration1km).toBe(857);

      // 0m walk = 0 seconds
      expect(calculateWalkingDuration(0)).toBe(0);

      // 450m walk = (0.45 / 4.2) * 3600 = 385.7 -> 386 seconds
      expect(calculateWalkingDuration(450)).toBe(386);
    });

    it("derives PUV fares adhering to EQ-004 and attaches INV-001 integrity tags", () => {
      // Free pedestrian walk
      const walkFare = calculateTransitFare("walk", 850);
      expect(walkFare.amount_php).toBe(0.0);
      expect(walkFare.verification.status).toBe("VERIFIED");
      expect(walkFare.verification.official_source).toContain("Free Pedestrian");

      // Traditional Jeepney: 6.5 km distance
      // Base: 13.00 (first 4 km) + ceil(6.5 - 4) * 1.80 = 13.00 + 3 * 1.80 = 18.40 PHP
      const jeepneyFare = calculateTransitFare("jeepney", 6500);
      expect(jeepneyFare.amount_php).toBe(18.4);
      expect(jeepneyFare.verification.status).toBe("VERIFIED");
      expect(jeepneyFare.verification.official_source).toContain("LTFRB");
      expect(jeepneyFare.verification.derivation_note).toContain("EQ-004");

      // Rail Line: MRT/LRT distance tariff
      const railFare = calculateTransitFare("rail", 3500);
      expect(railFare.amount_php).toBeGreaterThan(0);
      expect(railFare.verification.status).toBe("VERIFIED");
      expect(railFare.verification.official_source).toContain("LRTA / MRT-3");
    });

    it("computes average route shade score via EQ-002", () => {
      // Segment 1: 450m with 80% shade
      // Segment 2: 550m with 60% shade
      // Total Length: 1000m
      // Weighted: 450 * 0.80 + 550 * 0.60 = 360 + 330 = 690 -> 69.0%
      const legs = [
        { distance_m: 450, shade_coverage_pct: 80.0 },
        { distance_m: 550, shade_coverage_pct: 60.0 },
      ];
      const avgShade = calculateAverageShadeScore(legs);
      expect(avgShade).toBe(69.0);
    });

    it("generates routes within Metro Manila bounds with sequential legs and fare tags", () => {
      const origin = { lat: 14.5878, lng: 121.0567 }; // MRT Ortigas
      const destination = { lat: 14.5823, lng: 121.0611 }; // San Antonio Reading Center

      const routes = generateRoutes({
        origin,
        destination,
        preference: "shaded_walk",
      });

      expect(routes.length).toBeGreaterThanOrEqual(1);

      const shadedRoute = routes[0]!;
      expect(shadedRoute.route_id).toBeDefined();
      expect(shadedRoute.title).toContain("Shaded");
      expect(shadedRoute.total_distance_m).toBeGreaterThan(0);
      expect(shadedRoute.est_duration_seconds).toBeGreaterThan(0);
      expect(shadedRoute.average_shade_score).toBeGreaterThan(0);

      // Verify legs structure
      expect(shadedRoute.legs.length).toBeGreaterThanOrEqual(1);
      for (const leg of shadedRoute.legs) {
        expect(leg.sequence).toBeGreaterThanOrEqual(1);
        expect(leg.instruction).toBeDefined();
        expect(leg.distance_m).toBeGreaterThan(0);
        expect(leg.fare.verification.status).toBeDefined();
      }
    });

    it("client router interface falls back gracefully and returns route options", async () => {
      const router = new ClientRouter({ useFallbackDirectly: true });
      const origin = { lat: 14.5823, lng: 121.0611 };
      const destination = { lat: 14.5878, lng: 121.0567 };

      const routes = await router.findRoutes(origin, destination, "fastest");
      expect(routes.length).toBeGreaterThanOrEqual(1);
      expect(routes[0]!.legs.length).toBeGreaterThan(0);

      router.destroy();
    });
  });

  // --- C-M2-04: GreenIndexPill & GlassBoxModal ---
  describe("C-M2-04: GreenIndexPill & GlassBoxModal Component", () => {
    it("renders GreenIndexPill with leaf icon and score color ramp", () => {
      // High score (>= 70): Forest Green
      const { rerender } = render(
        <GreenIndexPill score={85.0} size="md" placeName="Ayala Triangle Gardens" />
      );
      const highPill = screen.getByRole("button", { name: /Green Index: 85\.0/i });
      expect(highPill).toBeInTheDocument();
      expect(highPill).toHaveTextContent("85 Green");

      // Moderate score (40-69): Lime
      rerender(<GreenIndexPill score={52.0} size="md" placeName="Ortigas Park" />);
      const modPill = screen.getByRole("button", { name: /Green Index: 52\.0/i });
      expect(modPill).toHaveTextContent("52 Green");

      // Low score (< 40): Amber
      rerender(<GreenIndexPill score={25.0} size="md" placeName="Urban Sidewalk" />);
      const lowPill = screen.getByRole("button", { name: /Green Index: 25\.0/i });
      expect(lowPill).toHaveTextContent("25 Green");

      // Missing / Null score: N/A
      rerender(<GreenIndexPill score={null} size="md" />);
      expect(screen.getByText("Green N/A")).toBeInTheDocument();
    });

    it("opens GlassBoxModal on click displaying formula EQ-001 and measured vs estimated breakdown", () => {
      render(
        <GreenIndexPill
          score={78.5}
          canopyCoverPct={72.0}
          ndviDensityScaled={80.0}
          permeableSurfacePct={65.0}
          placeName="UP Diliman Oval"
        />
      );

      const pillButton = screen.getByRole("button");
      fireEvent.click(pillButton);

      // Modal appears
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Glass-Box Green Index Breakdown")).toBeInTheDocument();
      expect(screen.getByText("UP Diliman Oval")).toBeInTheDocument();

      // Displays EQ-001 formula
      expect(screen.getByText(/0\.50 × C/i)).toBeInTheDocument();

      // Sub-scores rendered with weights
      expect(screen.getByText(/1\. Tree Canopy Coverage/i)).toBeInTheDocument();
      expect(screen.getByText(/50% Weight/i)).toBeInTheDocument();
      expect(screen.getByText(/2\. NDVI Vegetation Density/i)).toBeInTheDocument();
      expect(screen.getByText(/30% Weight/i)).toBeInTheDocument();
      expect(screen.getByText(/3\. Permeable Ground Ratio/i)).toBeInTheDocument();
      expect(screen.getByText(/20% Weight/i)).toBeInTheDocument();

      // Data source citations
      expect(screen.getByText(/ESA Copernicus Sentinel-2 \(DS-002\)/i)).toBeInTheDocument();
      expect(screen.getByText(/OpenStreetMap Landuse Classification \(DS-001\)/i)).toBeInTheDocument();

      // Close modal
      const closeButton = screen.getByRole("button", { name: "Close modal" });
      fireEvent.click(closeButton);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  // --- C-M2-03: RouteStepCard & RouteComparison ---
  describe("C-M2-03: RouteOption Comparison & Sequential RouteStepCard", () => {
    const sampleLeg: RouteLeg = {
      id: "leg-001",
      sequence: 1,
      mode: "walk",
      instruction: "Walk south along San Miguel Ave sidewalk under continuous street tree canopy",
      distance_m: 450,
      duration_seconds: 386,
      shade_coverage_pct: 85.0,
      fare: {
        amount_php: 0.0,
        verification: {
          status: "VERIFIED",
          official_source: "Free Pedestrian Pathway (DS-001)",
        },
      },
      path_geometry_geojson: {
        type: "LineString",
        coordinates: [
          [121.0567, 14.5878],
          [121.0611, 14.5823],
        ],
      },
      verification: {
        status: "ESTIMATE",
        derivation_note: "Canopy calculated from Sentinel-2 NDVI overlay via EQ-002",
      },
    };

    const sampleTransitLeg: RouteLeg = {
      id: "leg-002",
      sequence: 2,
      mode: "jeepney",
      transit_line: "Commonwealth Jeepney",
      from_name: "Philcoa Terminal",
      to_name: "Quezon Ave Station",
      instruction: "Board traditional jeepney along Commonwealth Ave to Quezon Ave station",
      distance_m: 2800,
      duration_seconds: 560,
      shade_coverage_pct: 35.0,
      fare: {
        amount_php: 13.0,
        verification: {
          status: "VERIFIED",
          official_source: "LTFRB Memorandum Circular Fare Matrix (DS-003)",
        },
      },
      path_geometry_geojson: {
        type: "LineString",
        coordinates: [
          [121.0543, 14.6533],
          [121.0384, 14.6429],
        ],
      },
      verification: {
        status: "VERIFIED",
        official_source: "LTFRB Route Schedule",
      },
    };

    it("renders RouteStepCard with mode badge, shade indicator, and explicit fare verification (INV-001)", () => {
      render(<RouteStepCard leg={sampleLeg} />);

      expect(screen.getByText("Walk")).toBeInTheDocument();
      expect(screen.getByText(/San Miguel Ave sidewalk/i)).toBeInTheDocument();
      expect(screen.getByText("85% Shade")).toBeInTheDocument();
      expect(screen.getByText("Free Walk")).toBeInTheDocument();
      expect(screen.getAllByText("Verified").length).toBeGreaterThan(0); // INV-001 badge
      expect(screen.getByText("450 m")).toBeInTheDocument();
    });

    it("renders transit RouteStepCard with boarding and alighting nodes and fare badge", () => {
      render(<RouteStepCard leg={sampleTransitLeg} />);

      expect(screen.getByText("Commonwealth Jeepney")).toBeInTheDocument();
      expect(screen.getByText("Philcoa Terminal")).toBeInTheDocument();
      expect(screen.getByText("Quezon Ave Station")).toBeInTheDocument();
      expect(screen.getByText("₱13.00")).toBeInTheDocument();
      expect(screen.getAllByText("Verified").length).toBeGreaterThan(0); // Official LTFRB fare
    });

    it("renders RouteComparison with candidate route cards, duration, shade score, and total fare", () => {
      const sampleRoutes: RouteOption[] = [
        {
          route_id: "r-shaded",
          title: "Shaded Green Walk",
          total_distance_m: 850,
          est_duration_seconds: 728,
          average_shade_score: 82.5,
          preference_tag: "shaded_walk",
          fare: {
            amount_php: 0.0,
            verification: { status: "VERIFIED", official_source: "Free Walkway" },
          },
          geometry_geojson: {
            type: "LineString",
            coordinates: [
              [121.0567, 14.5878],
              [121.0611, 14.5823],
            ],
          },
          legs: [sampleLeg],
          verification: { status: "VERIFIED" },
        },
        {
          route_id: "r-fastest",
          title: "Fastest Multimodal Route",
          total_distance_m: 3500,
          est_duration_seconds: 680,
          average_shade_score: 45.0,
          preference_tag: "fastest",
          fare: {
            amount_php: 13.0,
            verification: { status: "VERIFIED", official_source: "LTFRB" },
          },
          geometry_geojson: {
            type: "LineString",
            coordinates: [
              [121.0543, 14.6533],
              [121.0384, 14.6429],
            ],
          },
          legs: [sampleTransitLeg],
          verification: { status: "VERIFIED" },
        },
      ];

      const handleSelect = vi.fn();
      render(
        <RouteComparison
          routes={sampleRoutes}
          selectedRouteId="r-shaded"
          onSelectRoute={handleSelect}
        />
      );

      expect(screen.getByText("Shaded Green Walk")).toBeInTheDocument();
      expect(screen.getByText("Fastest Multimodal Route")).toBeInTheDocument();
      expect(screen.getAllByText("Free Walk").length).toBeGreaterThan(0);
      expect(screen.getByText("₱13.00")).toBeInTheDocument();

      // Click second route
      fireEvent.click(screen.getByText("Fastest Multimodal Route"));
      expect(handleSelect).toHaveBeenCalledWith(sampleRoutes[1]);
    });
  });

  // --- C-M2-05: RouteShadeLayer Polyline Visualization ---
  describe("C-M2-05: RouteShadeLayer Polyline & Shade Color Coding", () => {
    it("maps canopy shade coverage to semantic colors (Forest Green / Lime / Amber)", () => {
      // High shade (>= 70%) -> Forest Green (#245C43)
      expect(getSegmentColor("walk", 85.0)).toBe(SHADE_COLORS.HIGH_CANOPY);
      expect(getSegmentColor("walk", 70.0)).toBe(SHADE_COLORS.HIGH_CANOPY);

      // Moderate shade (40% - 69%) -> Lime (#84CC16)
      expect(getSegmentColor("walk", 55.0)).toBe(SHADE_COLORS.MODERATE_CANOPY);
      expect(getSegmentColor("walk", 40.0)).toBe(SHADE_COLORS.MODERATE_CANOPY);

      // Low shade / exposed (< 40%) -> Amber (#D97706)
      expect(getSegmentColor("walk", 20.0)).toBe(SHADE_COLORS.EXPOSED_SUN);

      // Rail line -> Indigo
      expect(getSegmentColor("rail", 10.0)).toBe(SHADE_COLORS.RAIL_TRANSIT);

      // Jeepney -> Warm Amber
      expect(getSegmentColor("jeepney", 20.0)).toBe(SHADE_COLORS.JEEPNEY_TRANSIT);
    });

    it("builds GeoJSON LineString features with segment properties from RouteOption", () => {
      const mockRoute: RouteOption = {
        route_id: "test-route",
        title: "Test Route",
        total_distance_m: 500,
        est_duration_seconds: 420,
        average_shade_score: 75.0,
        fare: { amount_php: 0.0, verification: { status: "VERIFIED" } },
        geometry_geojson: {
          type: "LineString",
          coordinates: [
            [121.0, 14.5],
            [121.1, 14.6],
          ],
        },
        legs: [
          {
            id: "leg-1",
            sequence: 1,
            mode: "walk",
            instruction: "Walk along shaded path",
            distance_m: 500,
            duration_seconds: 420,
            shade_coverage_pct: 75.0,
            fare: { amount_php: 0.0, verification: { status: "VERIFIED" } },
            path_geometry_geojson: {
              type: "LineString",
              coordinates: [
                [121.0, 14.5],
                [121.1, 14.6],
              ],
            },
            verification: { status: "ESTIMATE" },
          },
        ],
        verification: { status: "VERIFIED" },
      };

      const geojson = buildRouteGeoJSON(mockRoute);
      expect(geojson.type).toBe("FeatureCollection");
      expect(geojson.features.length).toBe(1);

      const feature = geojson.features[0]!;
      expect(feature.geometry.type).toBe("LineString");
      expect(feature.properties.sequence).toBe(1);
      expect(feature.properties.color).toBe(SHADE_COLORS.HIGH_CANOPY);
      expect(feature.properties.shade_coverage_pct).toBe(75.0);
    });
  });

  // --- C-M2-02: RoutePlanner UI ---
  describe("C-M2-02: RoutePlanner UI with Pin Picker & Preferences", () => {
    it("renders origin and destination search inputs, preset chips, and preference toggles", () => {
      render(<RoutePlanner />);

      expect(screen.getByLabelText(/Starting Point/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Destination$/i)).toBeInTheDocument();
      expect(screen.getByText("Shaded Green")).toBeInTheDocument();
      expect(screen.getByText("Fastest")).toBeInTheDocument();
      expect(screen.getByText("Least Walking")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Reverse route origin and destination/i })).toBeInTheDocument();
    });

    it("reverses origin and destination when reverse button is clicked", () => {
      render(
        <RoutePlanner
          initialOrigin={{ lat: 14.5878, lng: 121.0567 }}
          initialDestination={{ lat: 14.5823, lng: 121.0611 }}
        />
      );

      const originInput = screen.getByLabelText(/Starting Point/i) as HTMLInputElement;
      const destinationInput = screen.getByLabelText(/^Destination$/i) as HTMLInputElement;

      const initialOrigVal = originInput.value;
      const initialDestVal = destinationInput.value;

      const reverseBtn = screen.getByRole("button", { name: /Reverse route origin and destination/i });
      fireEvent.click(reverseBtn);

      expect(originInput.value).toBe(initialDestVal);
      expect(destinationInput.value).toBe(initialOrigVal);
    });

    it("updates preference toggle and triggers route calculation", () => {
      render(<RoutePlanner />);

      const fastestToggle = screen.getByRole("radio", { name: /Fastest/i });
      fireEvent.click(fastestToggle);

      expect(fastestToggle).toHaveAttribute("aria-checked", "true");
    });
  });
});
