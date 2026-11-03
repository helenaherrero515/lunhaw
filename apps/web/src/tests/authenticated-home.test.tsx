import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import HomePage from "@/app/home/page";
import { authService, MockAuthService } from "@/lib/auth/auth-service";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/home",
  useSearchParams: () => new URLSearchParams(),
}));

describe("Authenticated Home/Discover Page (/home)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    await authService.logOut();
  });

  it("redirects unauthenticated users to landing page /", async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("renders authenticated home layout when user is logged in", async () => {
    // Log in mock user
    await authService.logIn("helena@lunhaw.ph", "password123");

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByRole("status", { name: /loading lunhaw/i })).toBeInTheDocument();
      expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
      expect(screen.getByLabelText("Home")).toBeInTheDocument();
      expect(screen.getByLabelText("Map")).toBeInTheDocument();
      expect(screen.getByLabelText("Saved")).toBeInTheDocument();
      expect(screen.getByLabelText("Profile")).toBeInTheDocument();
    });
  });

  it("persists authenticated user in localStorage across session checks", async () => {
    const signupRes = await authService.signUp("Helena", "helena@lunhaw.ph", "securePass123");
    expect(signupRes.user).not.toBeNull();

    const stored = localStorage.getItem("lunhaw.auth_user");
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!).email).toBe("helena@lunhaw.ph");

    const current = await authService.getCurrentUser();
    expect(current?.email).toBe("helena@lunhaw.ph");
  });

  it("clears localStorage session on logout", async () => {
    await authService.logIn("user@lunhaw.ph", "password123");
    expect(localStorage.getItem("lunhaw.auth_user")).toBeTruthy();

    await authService.logOut();
    expect(localStorage.getItem("lunhaw.auth_user")).toBeNull();
    const current = await authService.getCurrentUser();
    expect(current).toBeNull();
  });
});
