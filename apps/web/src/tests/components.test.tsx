import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  VerificationBadge,
  FacilityDisclaimerBanner,
  FACILITY_DISCLAIMER_COPY,
} from "@lunhaw/ui";
import {
  MapLibreMap,
  DEFAULT_METRO_MANILA_CENTER,
  DEFAULT_ZOOM,
  OPENFREEMAP_LIBERTY_STYLE,
} from "@/components/map/MapLibreMap";

describe("VerificationBadge Component (C-M0-02 / INV-001)", () => {
  it("renders VERIFIED status with green styling, icon, and source details", () => {
    render(
      <VerificationBadge
        status="VERIFIED"
        sourceName="Pasig City LGU"
        lastVerifiedAt="2026-11-01"
      />
    );

    const badge = screen.getByRole("status");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Verified");
    expect(badge).toHaveAttribute("aria-label", "Verified data status");

    // High contrast green classes conforming to WCAG AA
    expect(badge.className).toContain("bg-[#DCFCE7]");
    expect(badge.className).toContain("text-[#166534]");

    // Tooltip content assertions
    expect(screen.getByRole("tooltip", { hidden: true })).toBeInTheDocument();
    expect(screen.getByText("Source:")).toBeInTheDocument();
    expect(screen.getByText("Pasig City LGU")).toBeInTheDocument();
    expect(screen.getByText("Audited:")).toBeInTheDocument();
    expect(screen.getByText("2026-11-01")).toBeInTheDocument();
  });

  it("renders ESTIMATE status with amber styling, icon, and derivation note", () => {
    render(
      <VerificationBadge
        status="ESTIMATE"
        derivationNote="Calculated via OpenStreetMap amenity tags and barangay hall hours"
      />
    );

    const badge = screen.getByRole("status");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Estimate");
    expect(badge).toHaveAttribute("aria-label", "Estimate data status");

    // High contrast amber classes conforming to WCAG AA
    expect(badge.className).toContain("bg-[#FEF3C7]");
    expect(badge.className).toContain("text-[#92400E]");

    // Derivation note in tooltip
    expect(screen.getByRole("tooltip", { hidden: true })).toBeInTheDocument();
    expect(screen.getByText("Derivation:")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Calculated via OpenStreetMap amenity tags and barangay hall hours"
      )
    ).toBeInTheDocument();
  });

  it("renders NOT_AVAILABLE status with slate neutral styling and explanatory text", () => {
    render(<VerificationBadge status="NOT_AVAILABLE" />);

    const badge = screen.getByRole("status");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Not available yet");
    expect(badge).toHaveAttribute("aria-label", "Not available yet data status");

    // High contrast slate classes conforming to WCAG AA
    expect(badge.className).toContain("bg-[#F1F5F9]");
    expect(badge.className).toContain("text-[#475569]");

    expect(screen.getByRole("tooltip", { hidden: true })).toBeInTheDocument();
    expect(
      screen.getByText("No official verification or estimate is available yet")
    ).toBeInTheDocument();
  });

  it("supports keyboard and mouse hover focus to toggle tooltip visibility", () => {
    render(
      <VerificationBadge
        status="VERIFIED"
        sourceName="Quezon City Public Library"
      />
    );

    const badge = screen.getByRole("status");
    const tooltip = screen.getByRole("tooltip", { hidden: true });

    expect(tooltip).toHaveAttribute("aria-hidden", "true");

    // Mouse enter opens tooltip
    fireEvent.mouseEnter(badge);
    expect(tooltip).toHaveAttribute("aria-hidden", "false");

    // Mouse leave closes tooltip
    fireEvent.mouseLeave(badge);
    expect(tooltip).toHaveAttribute("aria-hidden", "true");

    // Focus opens tooltip
    fireEvent.focus(badge);
    expect(tooltip).toHaveAttribute("aria-hidden", "false");

    // Escape closes tooltip
    fireEvent.keyDown(badge, { key: "Escape" });
    expect(tooltip).toHaveAttribute("aria-hidden", "true");
  });
});

describe("FacilityDisclaimerBanner Component (C-M0-03 / INV-002)", () => {
  it("renders the exact non-negotiable disclaimer copy with accessible note role", () => {
    render(<FacilityDisclaimerBanner />);

    const banner = screen.getByRole("note");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveAttribute("id", "facility-disclaimer-banner");
    expect(banner).toHaveAttribute(
      "aria-label",
      "Facility operating hours disclaimer"
    );

    // Assert exact non-negotiable copy match
    const expectedCopy =
      "Please verify operating hours directly with the facility before traveling, as local barangay schedules may change without notice.";
    expect(banner).toHaveTextContent(expectedCopy);
    expect(FACILITY_DISCLAIMER_COPY).toBe(expectedCopy);
  });

  it("applies prominent warning tone styling and cannot be dismissed", () => {
    const { container } = render(<FacilityDisclaimerBanner />);

    const banner = container.querySelector("#facility-disclaimer-banner");
    expect(banner).toBeInTheDocument();

    // Prominent amber warning tone styling
    expect(banner?.className).toContain("bg-[#FFF4DF]");
    expect(banner?.className).toContain("text-[#7A3E06]");

    // Non-dismissible: Must never render a close or dismiss button
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/close|dismiss/i)).not.toBeInTheDocument();
  });
});

describe("MapLibreMap Component (C-M0-04)", () => {
  it("exposes default Metro Manila coordinates and OpenFreeMap vector tile style constants", () => {
    expect(DEFAULT_METRO_MANILA_CENTER).toEqual([120.9842, 14.5995]);
    expect(DEFAULT_ZOOM).toBe(12);
    expect(OPENFREEMAP_LIBERTY_STYLE).toBe(
      "https://tiles.openfreemap.org/styles/liberty"
    );
  });

  it("renders container element with accessible role and default container attributes", () => {
    render(<MapLibreMap />);

    const mapContainer = screen.getByTestId("maplibre-container");
    expect(mapContainer).toBeInTheDocument();
    expect(mapContainer).toHaveAttribute("role", "region");
    expect(mapContainer).toHaveAttribute(
      "aria-label",
      "Metro Manila green spaces and study havens map"
    );
    expect(mapContainer).toHaveAttribute("id", "lunhaw-maplibre-container");
  });
});
