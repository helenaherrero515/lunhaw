import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/home",
  useSearchParams: () => new URLSearchParams(),
}));

const fetchPlaces = vi.fn();
const planTrip = vi.fn();
const askGuide = vi.fn();
vi.mock("@/lib/api/client", () => ({
  fetchPlaces: (...a: unknown[]) => fetchPlaces(...a),
  fetchGreenIndex: () => Promise.resolve(null),
  planTrip: (...a: unknown[]) => planTrip(...a),
  askGuide: (...a: unknown[]) => askGuide(...a),
  guideStatus: () => Promise.resolve({ routing: true, guide: true }),
  subscribeToNewsletter: vi.fn(),
}));

import HomePage from "@/app/home/page";
import { authService } from "@/lib/auth/auth-service";

const LIB = {
  id: "ae100000-0000-4000-8000-000000000001",
  name: "National Library of the Philippines",
  category: "library",
  city: "Manila",
  address: "T.M. Kalaw St, Ermita, Manila",
  coordinates: { lat: 14.5828, lng: 120.9822 },
  verification: { status: "ESTIMATE" },
};
const TRIP = {
  from: { label: "Cubao, Quezon City", lat: 14.6208, lng: 121.051 },
  to: { label: "National Library of the Philippines", lat: 14.5828, lng: 120.9822 },
  straight_line_km: 8.6,
  options: [
    {
      kind: "train",
      title: "MRT Line 3 + LRT Line 1",
      duration_min: 52,
      legs: [
        { mode: "walk", from: "Cubao, Quezon City", to: "Araneta Center - Cubao station", distance_m: 350, duration_min: 5, steps: [{ instruction: "Head south on EDSA", distance_m: 350 }], path: [[121.051, 14.6208], [121.0528, 14.6194]] },
        { mode: "rail", line: "MRT3", line_name: "MRT Line 3", colour: "#1F5FB8", board: "Araneta Center - Cubao", alight: "Taft Avenue", towards: "Taft Avenue", stops: 9, duration_min: 28, path: [[121.0528, 14.6194], [121.0012, 14.5377]] },
        { mode: "transfer", at: "Taft Avenue → EDSA", note: "Walkway between EDSA (LRT-1) and Taft Avenue (MRT-3)", duration_min: 7 },
        { mode: "rail", line: "LRT1", line_name: "LRT Line 1", colour: "#2E9E4F", board: "EDSA", alight: "United Nations", towards: "Fernando Poe Jr.", stops: 5, duration_min: 18, path: [[120.9994, 14.5386], [120.9845, 14.5826]] },
        { mode: "walk", from: "United Nations station", to: "National Library of the Philippines", distance_m: 420, duration_min: 6, steps: [], path: [[120.9845, 14.5826], [120.9822, 14.5828]] },
      ],
      fare: { status: "NOT_AVAILABLE", note: "Train fares aren’t confirmed in Lunhaw yet. Check the fare at the station." },
    },
    {
      kind: "walk",
      title: "Walk",
      duration_min: 140,
      legs: [{ mode: "walk", from: "Cubao", to: "National Library", distance_m: 11200, duration_min: 140, steps: [], path: [] }],
      fare: { status: "VERIFIED", amount_php: 0, note: "Walking is free." },
    },
  ],
  sakay_url: "https://sakay.ph/app/trip?from=14.620800,121.051000&to=14.582800,120.982200",
  verification: { status: "ESTIMATE", note: "Train times assume about 2.5 minutes between stations." },
  sources: ["Walking routes © openrouteservice.org by HeiGIT · Map data © OpenStreetMap contributors"],
};

async function openRoute() {
  render(<HomePage />);
  await waitFor(() => expect(screen.getAllByText("National Library of the Philippines").length).toBeGreaterThan(0));
  fireEvent.click(screen.getByRole("button", { name: /View details for National Library/ }));
  fireEvent.click(document.querySelector('#sheet [data-a="route"]')!);
}

describe("Commute: real trip options and the AI guide", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    fetchPlaces.mockResolvedValue([LIB]);
    await authService.logOut();
    await authService.logIn("helena@lunhaw.ph", "password123");
  });

  it("shows real options from the planner: legs, estimates, unknown fares, and a Sakay.ph hand-off for jeepneys", async () => {
    planTrip.mockResolvedValue(TRIP);
    await openRoute();
    fireEvent.click(document.querySelector('[data-a="manual"]')!);
    fireEvent.click(document.querySelector('[data-a="st"][data-i="0"]')!); // Cubao
    await waitFor(() => expect(document.querySelector(".tr-opt")).not.toBeNull());

    expect(planTrip).toHaveBeenCalledWith(
      expect.objectContaining({ label: "Cubao, Quezon City" }),
      expect.objectContaining({ label: "National Library of the Philippines", lat: 14.5828 })
    );
    const sheet = document.querySelector("#sheet")!.textContent!;
    expect(sheet).toContain("MRT Line 3 + LRT Line 1");
    expect(sheet).toContain("about 52 min");
    expect(sheet).toContain("Board at Araneta Center - Cubao towards Taft Avenue, ride 9 stops, get off at Taft Avenue");
    expect(sheet).toContain("Fare: Not available yet.");
    expect(sheet).toContain("Fare: ₱0");
    expect(sheet).toContain("we won’t guess them");
    const sakay = document.querySelector('#sheet a[href^="https://sakay.ph/app/trip"]') as HTMLAnchorElement;
    expect(sakay.getAttribute("href")).toBe(TRIP.sakay_url);
    expect(sakay.getAttribute("rel")).toBe("noopener");
  });

  it("falls back to the labelled straight-line estimate when the planner is unavailable", async () => {
    planTrip.mockRejectedValue(new Error("offline"));
    await openRoute();
    fireEvent.click(document.querySelector('[data-a="manual"]')!);
    fireEvent.click(document.querySelector('[data-a="st"][data-i="0"]')!);
    await waitFor(() => expect(document.querySelector('[data-a="wd"]')).not.toBeNull());
    expect(document.querySelector("#sheet")!.textContent).toMatch(/straight-line distance/i);
  });

  it("chats with the guide: sends the conversation and destination, shows the reply and the planner's trip", async () => {
    askGuide.mockResolvedValue({ reply: "Take the **MRT-3** to Taft Avenue, then LRT-1 to United Nations.", trip: TRIP });
    await openRoute();
    fireEvent.click(document.querySelector('[data-a="guide"]')!);
    expect(document.querySelector("#sheet")!.textContent).toContain("AI can make mistakes");

    const input = document.querySelector("#gdin") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "I'm at Cubao" } });
    fireEvent.submit(document.querySelector("#gdform")!);

    await waitFor(() => expect(document.querySelector(".gd-m.ai")).not.toBeNull());
    expect(askGuide).toHaveBeenCalledWith({
      messages: [{ role: "user", content: "I'm at Cubao" }],
      location: null,
      destination_id: LIB.id,
    });
    expect(document.querySelector(".gd-m.ai b")!.textContent).toBe("MRT-3");
    expect(document.querySelectorAll("#sheet .tr-opt").length).toBe(2);
  });

  it("shows the guide's error and keeps the chat usable", async () => {
    askGuide.mockRejectedValue(new Error("Please wait a minute before asking again."));
    await openRoute();
    fireEvent.click(document.querySelector('[data-a="guide"]')!);
    fireEvent.change(document.querySelector("#gdin")!, { target: { value: "hi" } });
    fireEvent.submit(document.querySelector("#gdform")!);
    await waitFor(() => expect(document.querySelector(".gd-err")!.textContent).toContain("wait a minute"));
    expect((document.querySelector("#gdin") as HTMLInputElement).disabled).toBe(false);
  });
});
