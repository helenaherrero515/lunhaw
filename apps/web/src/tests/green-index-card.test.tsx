import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/home",
  useSearchParams: () => new URLSearchParams(),
}));

const fetchPlaces = vi.fn();
const fetchGreenIndex = vi.fn();
vi.mock("@/lib/api/client", () => ({
  fetchPlaces: (...a: unknown[]) => fetchPlaces(...a),
  fetchGreenIndex: (...a: unknown[]) => fetchGreenIndex(...a),
  subscribeToNewsletter: vi.fn(),
  planTrip: () => Promise.reject(new Error("offline")),
  askGuide: () => Promise.reject(new Error("offline")),
  guideStatus: () => Promise.resolve({ routing: false, guide: false }),
}));

import HomePage from "@/app/home/page";
import { authService } from "@/lib/auth/auth-service";

const PARK = {
  id: "ae200000-0000-4000-8000-000000000002",
  name: "Arroceros Forest Park",
  category: "park",
  city: "Manila",
  address: "Antonio Villegas St, Manila",
  coordinates: { lat: 14.5946, lng: 120.9817 },
  verification: { status: "ESTIMATE" },
};
const PUBLISHED = {
  status: "ESTIMATE",
  method: "EQ-005 v1",
  question: "How green is this park?",
  score: 80,
  band: "High",
  range: [75, 85],
  borderline: false,
  unit: { type: "park_polygon", source: "OSM way/30106291", area_ha: 2.12 },
  components: [
    { key: "tree", label: "Tree canopy", value_pct: 91.2, target_pct: 30, weight: 0.6, sub_score: 100 },
    { key: "other_green", label: "Other greenery and water", value_pct: 1.3, target_pct: 30, weight: 0.2, sub_score: 4.3 },
    { key: "unsealed", label: "Unsealed ground", value_pct: 92.5, target_pct: null, weight: 0.2, sub_score: 92.5 },
  ],
  vegetation_vigour_ndvi: 0.701,
  green_access_300m: null,
  imagery: { canopy: "2019-04", vegetation: "2025-12-01 to 2026-05-31" },
  checked: { on: "2026-11-20", points: 120 },
  sources: ["Canopy height: Version 2 High Resolution Canopy Height Maps by WRI and Meta (CC BY 4.0)."],
  caveats: ["Satellite-based screening estimate; may miss small trees, recent changes or paved areas. Not an official inventory."],
};

async function openDetails() {
  render(<HomePage />);
  await waitFor(() => expect(screen.getAllByText("Arroceros Forest Park").length).toBeGreaterThan(0));
  fireEvent.click(screen.getByRole("button", { name: /View details for Arroceros Forest Park/ }));
}

describe("Green Index card (EQ-005)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    fetchPlaces.mockResolvedValue([PARK]);
    await authService.logOut();
    await authService.logIn("helena@lunhaw.ph", "password123");
  });

  it("shows a published score as an Estimate with range, components vs targets, dates, caveats and sources", async () => {
    fetchGreenIndex.mockResolvedValue(PUBLISHED);
    await openDetails();
    const card = await waitFor(() => {
      const el = document.querySelector("#gic")!;
      expect(el.textContent).toContain("80");
      return el;
    });
    expect(fetchGreenIndex).toHaveBeenCalledWith(PARK.id);
    const text = card.textContent!;
    expect(text).toContain("Estimate");
    expect(text).toContain("High");
    expect(text).toContain("Likely 75–85");
    expect(text).toContain("Tree canopy");
    expect(text).toContain("91% of 30% target");
    expect(text).toContain("Canopy imagery 2019-04");
    expect(text).toContain("checked 2026-11-20 on 120 photo points");
    expect(text).toMatch(/Not an official inventory/);
    expect(text).toContain("CC BY 4.0");
    expect(card.querySelector(".gi-bar i")!.getAttribute("style")).toContain("width:100%");
  });

  it("says Not available yet when the place hasn't been checked and published", async () => {
    fetchGreenIndex.mockResolvedValue(null);
    await openDetails();
    await waitFor(() => expect(document.querySelector("#gic")!.textContent).toContain("Not available yet"));
    expect(document.querySelector("#gic")!.textContent).not.toMatch(/\/100/);
  });

  it("explains the method honestly: a Lunhaw convention, an estimate, not temperature or health", async () => {
    fetchGreenIndex.mockResolvedValue(null);
    await openDetails();
    await waitFor(() => expect(document.querySelector("#gic")!.textContent).toContain("Not available yet"));
    fireEvent.click(screen.getByRole("button", { name: "How the Green Index works" }));
    const sheet = document.querySelector("#sheet")!.textContent!;
    expect(sheet).toContain("Lunhaw convention");
    expect(sheet).toContain("30% canopy target");
    expect(sheet).toMatch(/not a temperature, health or official measurement/);
  });
});
