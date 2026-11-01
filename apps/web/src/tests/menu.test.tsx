import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "@/components/Header";
import { useLunhawStore } from "@/lib/store/use-lunhaw-store";

describe("Header Mobile Menu", () => {
  beforeEach(() => {
    useLunhawStore.setState({ isMobileMenuOpen: false });
  });

  it("renders brand logo and nav buttons", () => {
    render(<Header />);
    expect(screen.getByLabelText("Lunhaw home")).toBeInTheDocument();
    expect(screen.getByText("LUNHAW")).toBeInTheDocument();
  });

  it("toggles mobile menu on hamburger click", () => {
    render(<Header />);
    const menuBtn = screen.getByLabelText("Toggle navigation menu");

    expect(menuBtn).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation", { name: "mobile-menu" })).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(menuBtn);
    expect(menuBtn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Toggle navigation menu" })).toBeInTheDocument();

    // Click to close
    fireEvent.click(menuBtn);
    expect(menuBtn).toHaveAttribute("aria-expanded", "false");
  });
});
