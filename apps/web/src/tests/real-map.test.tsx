import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/home",
  useSearchParams: () => new URLSearchParams(),
}));

const fetchPlaces = vi.fn();
vi.mock("@/lib/api/client", () => ({
  fetchPlaces: (...a: unknown[]) => fetchPlaces(...a),
  subscribeToNewsletter: vi.fn(),
  fetchGreenIndex: () => Promise.resolve(null),
}));

// jsdom can't draw WebGL, so the real map is replaced by a recording stand-in.
const controller = { update: vi.fn(), showWalk: vi.fn(), resize: vi.fn(), destroy: vi.fn() };
const createRealMap = vi.fn();
vi.mock("@/app/home/real-map", () => ({ createRealMap: (...a: unknown[]) => createRealMap(...a) }));

import HomePage from "@/app/home/page";
import { authService } from "@/lib/auth/auth-service";

const LIB = {
  id: "ae100000-0000-4000-8000-000000000001",
  name: "Manila City Library - Main Branch",
  category: "library",
  city: "Manila",
  address: "Ermita, Manila",
  coordinates: { lat: 14.5925, lng: 120.9811 },
  verification: { status: "ESTIMATE" },
};
const PARK = {
  id: "ae200000-0000-4000-8000-000000000001",
  name: "Arroceros Forest Park",
  category: "park",
  city: "Manila",
  address: "Antonio Villegas St, Manila",
  coordinates: { lat: 14.5946, lng: 120.9817 },
  verification: { status: "ESTIMATE" },
};

const mapbox = () => document.querySelector(".mapbox") as HTMLElement;
const lastUpdate = () => controller.update.mock.calls.at(-1) as [Array<{ id: string; t: string }>, string | null, boolean];
const click = (selector: string) => fireEvent.click(document.querySelector(selector) as Element);

async function openMap() {
  render(<HomePage />);
  await waitFor(() => expect(screen.getAllByText("Arroceros Forest Park").length).toBeGreaterThan(0));
  click('#bar [data-t="map"]');
}

describe("Map tab: real map (MapLibre + OpenFreeMap)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    createRealMap.mockResolvedValue(controller);
    fetchPlaces.mockResolvedValue([LIB, PARK]);
    await authService.logOut();
    await authService.logIn("helena@lunhaw.ph", "password123");
  });

  it("loads the map only when the Map tab opens, then replaces the drawn map", async () => {
    render(<HomePage />);
    await waitFor(() => expect(screen.getAllByText("Arroceros Forest Park").length).toBeGreaterThan(0));
    expect(createRealMap).not.toHaveBeenCalled();

    click('#bar [data-t="map"]');
    await waitFor(() => expect(mapbox().classList.contains("real")).toBe(true));
    expect(createRealMap).toHaveBeenCalledTimes(1);
    expect(document.querySelector("#mgl")).not.toBeNull();
    expect(lastUpdate()[0].map((p) => p.id).sort()).toEqual([LIB.id, PARK.id].sort());
  });

  it("keeps the list, filters, pins and place card in sync", async () => {
    await openMap();
    await waitFor(() => expect(mapbox().classList.contains("real")).toBe(true));

    click('[data-a="mf"][data-f="park"]');
    expect(lastUpdate()[0].map((p) => p.t)).toEqual(["park"]);

    // Picking from the list flies the map to the place.
    click(`#mlist [data-id="${PARK.id}"]`);
    expect(lastUpdate().slice(1)).toEqual([PARK.id, true]);
    expect(document.querySelector("#prev")!.textContent).toContain("Arroceros Forest Park");

    // Tapping a pin selects it without flying the map around.
    click('[data-a="mf"][data-f="all"]');
    const { onSelect } = createRealMap.mock.calls[0]![1] as { onSelect: (id: string) => void };
    onSelect(LIB.id);
    expect(lastUpdate().slice(1)).toEqual([LIB.id, false]);
    expect(document.querySelector("#prev")!.textContent).toContain("Manila City Library - Main Branch");
  });

  it("shows the walking estimate on the real map", async () => {
    await openMap();
    await waitFor(() => expect(mapbox().classList.contains("real")).toBe(true));

    click(`#mlist [data-id="${PARK.id}"]`);
    click(`#prev [data-a="route"]`);
    click('[data-a="manual"]');
    click('[data-a="st"][data-i="0"]'); // Cubao
    click('[data-a="wd"]');
    click('[data-a="wmap"]');

    expect(controller.showWalk).toHaveBeenCalledTimes(1);
    const [from, to] = controller.showWalk.mock.calls[0]!;
    expect(from).toMatchObject({ n: "Cubao, Quezon City" });
    expect(to).toMatchObject({ id: PARK.id });
  });

  it("keeps the drawn map when the real map can't load", async () => {
    createRealMap.mockRejectedValue(new Error("WebGL is not available"));
    await openMap();
    await waitFor(() => expect(createRealMap).toHaveBeenCalled());
    await waitFor(() => expect(document.querySelector("#mgl")).toBeNull());
    expect(mapbox().classList.contains("real")).toBe(false);
    expect(document.querySelectorAll('#msvg [data-a="sel"]').length).toBe(2);

    // No "Show on map" button for the walking estimate when there's no real map.
    click(`#mlist [data-id="${PARK.id}"]`);
    click(`#prev [data-a="route"]`);
    click('[data-a="manual"]');
    click('[data-a="st"][data-i="0"]');
    click('[data-a="wd"]');
    expect(document.querySelector('[data-a="wmap"]')).toBeNull();
  });

  it("removes the map when leaving /home", async () => {
    const { unmount } = render(<HomePage />);
    await waitFor(() => expect(screen.getAllByText("Arroceros Forest Park").length).toBeGreaterThan(0));
    click('#bar [data-t="map"]');
    await waitFor(() => expect(mapbox().classList.contains("real")).toBe(true));
    expect(controller.destroy).not.toHaveBeenCalled();
    unmount();
    expect(controller.destroy).toHaveBeenCalledTimes(1);
  });

  it("discards a map that finishes loading after /home was left", async () => {
    let finish!: (c: typeof controller) => void;
    createRealMap.mockReturnValue(new Promise((r) => (finish = r)));
    const { unmount } = render(<HomePage />);
    await waitFor(() => expect(screen.getAllByText("Arroceros Forest Park").length).toBeGreaterThan(0));
    click('#bar [data-t="map"]');
    await waitFor(() => expect(createRealMap).toHaveBeenCalled());
    unmount();
    finish(controller);
    await waitFor(() => expect(controller.destroy).toHaveBeenCalledTimes(1));
  });
});
