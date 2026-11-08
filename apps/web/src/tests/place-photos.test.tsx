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
  planTrip: () => Promise.reject(new Error("offline")),
  askGuide: () => Promise.reject(new Error("offline")),
  guideStatus: () => Promise.resolve({ routing: false, guide: false }),
  fetchGreenIndex: () => Promise.resolve(null),
}));

import HomePage from "@/app/home/page";
import PHOTOS from "@/lib/place-photos.json";
import { authService } from "@/lib/auth/auth-service";

// Arroceros Forest Park has a confirmed Commons photo; Pateros Municipal Library doesn't.
const WITH_PHOTO = {
  id: "ae200000-0000-4000-8000-000000000002",
  name: "Arroceros Forest Park",
  category: "park",
  city: "Manila",
  address: "Antonio Villegas St, Ermita, Manila",
  coordinates: { lat: 14.5946, lng: 120.9817 },
  verification: { status: "ESTIMATE" },
};
const WITHOUT_PHOTO = {
  id: "ae100000-0000-4000-8000-000000000016",
  name: "Pateros Municipal Library",
  category: "library",
  city: "Pateros",
  address: "Pateros",
  coordinates: { lat: 14.5446, lng: 121.0687 },
  verification: { status: "ESTIMATE" },
};

describe("Place photos (Wikimedia Commons)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    fetchPlaces.mockResolvedValue([WITHOUT_PHOTO, WITH_PHOTO]);
    await authService.logOut();
    await authService.logIn("helena@lunhaw.ph", "password123");
  });

  it("every photo has the credit its licence requires, from an allowed licence", () => {
    for (const [id, p] of Object.entries(PHOTOS as Record<string, any>)) {
      expect(p.src).toBe(`/places/${id}.webp`);
      expect(p.author).toBeTruthy();
      expect(p.license).toMatch(/^(CC0|Public domain|CC BY(-SA)? [0-9.]+)$/i);
      expect(p.source).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    }
  });

  it("uses the photo as the Popular places cover, listed first, and keeps the illustration otherwise", async () => {
    render(<HomePage />);
    await waitFor(() => expect(document.querySelectorAll(".pops .plc").length).toBe(2));
    const cards = [...document.querySelectorAll(".pops .plc")];
    // Places with photos come first.
    expect(cards[0]!.textContent).toContain("Arroceros Forest Park");
    expect(cards[0]!.querySelector("img")!.getAttribute("src")).toBe(`/places/${WITH_PHOTO.id}.webp`);
    expect(cards[0]!.querySelector(".pacr")!.textContent).toContain((PHOTOS as any)[WITH_PHOTO.id].author);
    expect(cards[1]!.querySelector("img")).toBeNull();
    expect(cards[1]!.querySelector(".pa svg")).not.toBeNull();
  });

  it("greets by first name, counts places per tile, and shows at most 8 popular places", async () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      ...WITHOUT_PHOTO,
      id: `ae100000-0000-4000-8000-0000000001${String(i).padStart(2, "0")}`,
      name: `Library ${i}`,
    }));
    fetchPlaces.mockResolvedValue([WITH_PHOTO, ...many]);
    render(<HomePage />);
    await waitFor(() => expect(document.querySelectorAll(".pops .plc").length).toBe(8));
    expect(document.querySelector(".hello")!.textContent).toMatch(/^Good (morning|afternoon|evening), helena$/);
    expect(document.querySelector('.ac2[data-f="lib"] small')!.textContent).toBe("10 libraries");
    expect(document.querySelector('.ac2[data-f="park"] small')!.textContent).toBe("1 park");
    expect(screen.getByRole("button", { name: "See all 11 places on the map" })).toBeInTheDocument();
  });

  it("shows the full, linked credit with the photo in the place details", async () => {
    render(<HomePage />);
    await waitFor(() => expect(screen.getAllByText("Arroceros Forest Park").length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole("button", { name: /View details for Arroceros Forest Park/ }));
    const credit = await waitFor(() => document.querySelector("#sheet .pcred")!);
    const photo = (PHOTOS as any)[WITH_PHOTO.id];
    expect(credit.textContent).toContain(photo.author);
    expect(credit.textContent).toContain("Wikimedia Commons");
    expect(credit.querySelector(`a[href="${photo.source}"]`)).not.toBeNull();
    expect(document.querySelector("#sheet .th.ph img")).not.toBeNull();
  });
});
