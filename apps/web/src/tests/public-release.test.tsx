import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace, prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/home",
  useSearchParams: () => new URLSearchParams(),
}));

const fetchPlaces = vi.fn();
const subscribeToNewsletter = vi.fn();
vi.mock("@/lib/api/client", () => ({
  fetchPlaces: (...a: unknown[]) => fetchPlaces(...a),
  subscribeToNewsletter: (...a: unknown[]) => subscribeToNewsletter(...a),
}));

import HomePage from "@/app/home/page";
import { AuthDialog } from "@/components/AuthDialog";
import { Footer } from "@/components/Footer";
import { authService, ACCOUNTS_UNAVAILABLE, SupabaseAuthService } from "@/lib/auth/auth-service";
import { useLunhawStore } from "@/lib/store/use-lunhaw-store";

const place = (over: Record<string, unknown> = {}) => ({
  id: "ae100000-0000-4000-8000-000000000001",
  name: "Manila City Library - Main Branch",
  category: "library",
  description: "Public library in Manila.",
  city: "Manila",
  barangay: "Ermita",
  address: "Mehan Garden, Antonio Villegas St, Ermita, Manila",
  coordinates: { lat: 14.5925, lng: 120.9811 },
  verification: { status: "ESTIMATE", derivation_note: "Location compiled from public directory listings." },
  ...over,
});

describe("Public release: accounts can't be faked in production", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("refuses sign-up and log-in when Supabase isn't configured in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const svc = new SupabaseAuthService();
    expect(await svc.signUp("A", "a@b.co", "password123")).toEqual({ user: null, error: ACCOUNTS_UNAVAILABLE });
    expect(await svc.logIn("a@b.co", "anything")).toEqual({ user: null, error: ACCOUNTS_UNAVAILABLE });
  });

  it("does not treat a user copied into localStorage as signed in", async () => {
    vi.stubEnv("NODE_ENV", "production");
    localStorage.setItem("lunhaw.auth_user", JSON.stringify({ id: "x", email: "fake@example.com" }));
    expect(await new SupabaseAuthService().getCurrentUser()).toBeNull();
    localStorage.clear();
  });
});

describe("Public release: /home uses the live directory", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    await authService.logOut();
    await authService.logIn("helena@lunhaw.ph", "password123");
  });

  it("renders places from the API with honest labels", async () => {
    fetchPlaces.mockResolvedValue([place()]);
    render(<HomePage />);
    await waitFor(() => expect(screen.getAllByText("Manila City Library - Main Branch").length).toBeGreaterThan(0));
    expect(document.body.textContent).not.toMatch(/sample|prototype/i);

    fireEvent.click(screen.getAllByRole("button", { name: /View details for Manila City Library/ })[0]!);
    await waitFor(() => expect(screen.getByText(/Please verify operating hours directly with the facility before traveling/)).toBeInTheDocument());
    expect(screen.getAllByText(/Not available yet/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Estimate/).length).toBeGreaterThan(0);
  });

  it("escapes text from the API instead of rendering it as HTML", async () => {
    fetchPlaces.mockResolvedValue([place({ name: '<img src=x onerror="window.__pwned=1">Evil' })]);
    render(<HomePage />);
    await waitFor(() => expect(screen.getAllByText(/<img src=x onerror=.*>Evil/).length).toBeGreaterThan(0));
    expect(document.querySelector('img[src="x"]')).toBeNull();
  });

  it("shows a retryable error when the API is unreachable", async () => {
    fetchPlaces.mockRejectedValueOnce(new Error("Couldn't reach Lunhaw. Check your connection and try again."));
    fetchPlaces.mockResolvedValueOnce([place()]);
    render(<HomePage />);
    await waitFor(() => expect(screen.getByText(/Couldn.t reach Lunhaw/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getAllByText("Manila City Library - Main Branch").length).toBeGreaterThan(0));
  });
});

describe("Public release: sign-up with email confirmation", () => {
  beforeEach(() => useLunhawStore.setState({ isAuthOpen: true, authMode: "signup" }));
  afterEach(() => vi.restoreAllMocks());

  it("asks the user to confirm their email instead of pretending they're signed in", async () => {
    vi.spyOn(authService, "signUp").mockResolvedValue({
      user: { id: "u1", email: "new@lunhaw.ph", name: "New" },
      needsEmailConfirmation: true,
    });
    render(<AuthDialog />);
    expect(screen.getByRole("link", { name: "Privacy Notice" })).toHaveAttribute("href", "/privacy");
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "New" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@lunhaw.ph" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(screen.getByText("Check your email")).toBeInTheDocument());
    expect(screen.queryByRole("link", { name: "Open my account" })).toBeNull();
  });
});

describe("Public release: newsletter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("saves the sign-up through the API and confirms", async () => {
    subscribeToNewsletter.mockResolvedValue(undefined);
    render(<Footer />);
    fireEvent.change(screen.getByLabelText("Your email"), { target: { value: "reader@lunhaw.ph" } });
    fireEvent.click(screen.getByRole("button", { name: "Subscribe" }));
    await waitFor(() => expect(screen.getByText("Thanks! We’ll keep you posted.")).toBeInTheDocument());
    expect(subscribeToNewsletter).toHaveBeenCalledWith("reader@lunhaw.ph");
  });

  it("shows the API's error instead of a fake success", async () => {
    subscribeToNewsletter.mockRejectedValue(new Error("Could not save the sign-up. Please try again later."));
    render(<Footer />);
    fireEvent.change(screen.getByLabelText("Your email"), { target: { value: "reader@lunhaw.ph" } });
    fireEvent.click(screen.getByRole("button", { name: "Subscribe" }));
    await waitFor(() => expect(screen.getByText(/Could not save the sign-up/)).toBeInTheDocument());
    expect(screen.queryByText("Thanks! We’ll keep you posted.")).toBeNull();
  });

  it("has no dead links", () => {
    render(<Footer />);
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).not.toContain("#");
    expect(hrefs).toEqual(expect.arrayContaining(["/privacy", "/terms"]));
  });
});

describe("Public release: leaving /home before places load", () => {
  it("ignores the late response instead of throwing", async () => {
    await authService.logIn("helena@lunhaw.ph", "password123");
    let resolve!: (v: unknown[]) => void;
    fetchPlaces.mockReturnValue(new Promise((r) => (resolve = r)));
    const errors: unknown[] = [];
    const onErr = (e: PromiseRejectionEvent) => errors.push(e.reason);
    window.addEventListener("unhandledrejection", onErr);
    const { unmount } = render(<HomePage />);
    await waitFor(() => expect(fetchPlaces).toHaveBeenCalled());
    unmount();
    resolve([place()]);
    await new Promise((r) => setTimeout(r, 50));
    window.removeEventListener("unhandledrejection", onErr);
    expect(errors).toEqual([]);
  });
});
