import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SavedItemsDrawer } from "@/components/saved/SavedItemsDrawer";
import { AuthDialog } from "@/components/AuthDialog";
import { LGUSelectorModal } from "@/components/location/LGUSelectorModal";
import { Header } from "@/components/Header";
import { useLunhawStore } from "@/lib/store/use-lunhaw-store";
import fs from "node:fs";
import path from "node:path";

/**
 * E-M3-03 / C-M3-03: Automated WCAG 2.1 AA Accessibility Audit
 * Traces to: WCAG 2.1 AA, C-M3-03, Design System Specs
 *
 * Criteria Validated:
 * 1. WCAG 2.1 Color Contrast: Mathematical verification of luminance and contrast ratios
 *    (>= 4.5:1 body text, >= 3:1 graphical UI/headers, >= 7:1 AAA brand tokens).
 * 2. Minimum Touch Target Bounds: Interactive elements satisfy 44x44px minimum bounds (WCAG 2.5.5 / 2.5.8).
 * 3. Visible Keyboard Focus Rings: Brand green #245C43 2px solid rings with 2px offset (WCAG 2.4.7).
 * 4. ARIA Dialog Attributes: role="dialog", aria-modal="true", accessible names/descriptions (WCAG 4.1.2).
 * 5. Screen reader accessibility: aria-selected on tabs, accessible close labels, sr-only utilities.
 */

// =========================================================================
// WCAG 2.1 Contrast Calculation Utilities
// =========================================================================

/**
 * Converts hex color string (e.g. "#245C43") to sRGB linear component
 */
function sRgbToLinear(c: number): number {
  const cNorm = c / 255;
  return cNorm <= 0.04045 ? cNorm / 12.92 : Math.pow((cNorm + 0.055) / 1.055, 2.4);
}

/**
 * Calculates relative luminance L for an sRGB hex color per WCAG 2.1 definition:
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
function getRelativeLuminance(hex: string): number {
  const cleanHex = hex.replace("#", "").trim();
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  const rLin = sRgbToLinear(r);
  const gLin = sRgbToLinear(g);
  const bLin = sRgbToLinear(b);

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Calculates WCAG 2.1 contrast ratio between two hex colors:
 * Ratio = (L1 + 0.05) / (L2 + 0.05), where L1 is the lighter luminance
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("E-M3-03 / C-M3-03: WCAG 2.1 AA Accessibility & Sunlight Audit", () => {
  beforeEach(() => {
    localStorage.clear();
    useLunhawStore.setState({
      isSavedDrawerOpen: false,
      isAuthOpen: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. WCAG 2.1 AA Color Contrast Verification
  // =========================================================================
  describe("1. Mathematical Color Contrast Audit (WCAG 1.4.3 / 1.4.11)", () => {
    const WHITE = "#FFFFFF";
    const LIME_ACCENT = "#98D746";

    // Palette values extracted from apps/web/src/styles/a11y-tokens.css
    const BRAND_COLORS = {
      brandGreen: "#245C43",
      brandGreenDark: "#163B2B",
      brandForest: "#0E1A15",
      textBody: "#16261F",
      textMuted: "#245C43",
      successText: "#125633",
      warningText: "#7A3E06",
      errorText: "#990000",
      outdoorFg: "#05120B",
    };

    it("verifies Brand Green (#245C43) exceeds WCAG 2.1 AA (4.5:1) and AAA (7:1) against white", () => {
      const ratio = getContrastRatio(BRAND_COLORS.brandGreen, WHITE);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
      expect(ratio).toBeCloseTo(7.85, 1);
    });

    it("verifies Brand Green Dark (#163B2B) delivers over 11:1 high contrast against white", () => {
      const ratio = getContrastRatio(BRAND_COLORS.brandGreenDark, WHITE);
      expect(ratio).toBeGreaterThanOrEqual(11.0);
    });

    it("verifies Ultra Deep Forest (#0E1A15) delivers over 17:1 high contrast against white", () => {
      const ratio = getContrastRatio(BRAND_COLORS.brandForest, WHITE);
      expect(ratio).toBeGreaterThanOrEqual(17.0);
    });

    it("verifies primary body text (#16261F) delivers over 13:1 high contrast against white", () => {
      const ratio = getContrastRatio(BRAND_COLORS.textBody, WHITE);
      expect(ratio).toBeGreaterThanOrEqual(13.0);
    });

    it("verifies semantic alert colors strictly satisfy WCAG AA >= 4.5:1 against white", () => {
      const successRatio = getContrastRatio(BRAND_COLORS.successText, WHITE);
      const warningRatio = getContrastRatio(BRAND_COLORS.warningText, WHITE);
      const errorRatio = getContrastRatio(BRAND_COLORS.errorText, WHITE);

      expect(successRatio).toBeGreaterThanOrEqual(8.0);
      expect(warningRatio).toBeGreaterThanOrEqual(7.0);
      expect(errorRatio).toBeGreaterThanOrEqual(7.0);
    });

    it("verifies dark forest text (#163B2B) achieves >= 4.5:1 against lime accent (#98D746)", () => {
      const ratio = getContrastRatio(BRAND_COLORS.brandGreenDark, LIME_ACCENT);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("verifies outdoor sunlight mode text (#05120B) reaches > 18:1 for direct glare visibility", () => {
      const ratio = getContrastRatio(BRAND_COLORS.outdoorFg, WHITE);
      expect(ratio).toBeGreaterThanOrEqual(18.0);
    });
  });

  // =========================================================================
  // 2. CSS Design Tokens File Audit (a11y-tokens.css)
  // =========================================================================
  describe("2. Design Tokens Integrity Audit (apps/web/src/styles/a11y-tokens.css)", () => {
    it("verifies mandatory focus ring tokens and touch target definitions", () => {
      const cssPath = path.resolve(__dirname, "../styles/a11y-tokens.css");
      expect(fs.existsSync(cssPath)).toBe(true);

      const css = fs.readFileSync(cssPath, "utf8");

      // Focus ring specifications
      expect(css).toContain("--a11y-focus-ring-color: #245C43;");
      expect(css).toContain("--a11y-focus-ring-width: 2px;");
      expect(css).toContain("--a11y-focus-ring-offset: 2px;");
      expect(css).toContain("--a11y-focus-ring-color-inverse: #98D746;");

      // Touch target specification (44x44px minimum)
      expect(css).toContain("--a11y-touch-target-min: 44px;");

      // Focus visible global rule
      expect(css).toContain(":focus-visible");
      expect(css).toContain("#245C43");

      // Screen reader utilities
      expect(css).toContain(".sr-only");
      expect(css).toContain(".a11y-skip-link");

      // Outdoor sunlight high contrast mode
      expect(css).toContain(".outdoor-sunlight-mode");
      expect(css).toContain("prefers-contrast: more");
    });
  });

  // =========================================================================
  // 3. Touch Target Bounds Verification (WCAG 2.5.5 / 2.5.8)
  // =========================================================================
  describe("3. Touch Target Bounds Verification (Minimum 44x44px)", () => {
    it("ensures SavedItemsDrawer close button and tabs conform to 44px touch targets", () => {
      render(<SavedItemsDrawer isOpen={true} />);

      // Close button
      const closeBtn = screen.getByTestId("saved-drawer-close");
      expect(closeBtn).toBeInTheDocument();
      expect(closeBtn.className).toContain("h-11");
      expect(closeBtn.className).toContain("w-11"); // 11 * 4px = 44px

      // Filter tabs
      const tabAll = screen.getByTestId("tab-all");
      const tabPlaces = screen.getByTestId("tab-places");
      const tabRoutes = screen.getByTestId("tab-routes");

      expect(tabAll.className).toContain("h-11");
      expect(tabPlaces.className).toContain("h-11");
      expect(tabRoutes.className).toContain("h-11");
    });

    it("ensures Header saved items button meets 44px touch target height", () => {
      render(<Header />);

      const savedBtn = screen.getByTestId("header-saved-btn");
      expect(savedBtn).toBeInTheDocument();
      expect(savedBtn.className).toContain("h-11"); // 44px
    });

    it("ensures LGUSelectorModal close button has accessible click target and clear label", () => {
      const handleClose = vi.fn();
      render(
        <LGUSelectorModal
          isOpen={true}
          onClose={handleClose}
          onSelectLocation={vi.fn()}
        />
      );

      const closeBtn = screen.getByRole("button", { name: "Close modal" });
      expect(closeBtn).toBeInTheDocument();
      expect(closeBtn).toHaveAttribute("aria-label", "Close modal");
    });
  });

  // =========================================================================
  // 4. ARIA Dialog Attributes & Screen Reader Semantics (WCAG 4.1.2)
  // =========================================================================
  describe("4. ARIA Dialog Attributes & Screen Reader Semantics", () => {
    it("verifies SavedItemsDrawer dialog semantics and tab accessibility", () => {
      render(<SavedItemsDrawer isOpen={true} />);

      // Dialog container
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-label", "Saved Places and Trips");

      // Close button label
      const closeBtn = screen.getByLabelText("Close saved drawer");
      expect(closeBtn).toBeInTheDocument();

      // Tablist container
      const tablist = screen.getByRole("tablist", { name: "Filter saved bookmarks" });
      expect(tablist).toBeInTheDocument();

      // Tabs role and aria-selected state
      const tabs = screen.getAllByRole("tab");
      expect(tabs.length).toBe(3);

      const tabAll = screen.getByRole("tab", { name: /all/i });
      expect(tabAll).toHaveAttribute("aria-selected", "true");

      const tabPlaces = screen.getByRole("tab", { name: /places/i });
      expect(tabPlaces).toHaveAttribute("aria-selected", "false");

      // Switch tab and verify aria-selected updates dynamically
      fireEvent.click(tabPlaces);
      expect(tabAll).toHaveAttribute("aria-selected", "false");
      expect(tabPlaces).toHaveAttribute("aria-selected", "true");
    });

    it("verifies AuthDialog dialog semantics, labelledby, and form labels", () => {
      useLunhawStore.setState({ isAuthOpen: true, authMode: "signup" });
      render(<AuthDialog />);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "auth-title");

      // Title heading
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading.id).toBe("auth-title");
      expect(heading).toHaveTextContent("Create your account");

      // Close button
      expect(screen.getByLabelText("Close")).toBeInTheDocument();

      // Form input labels
      expect(screen.getByLabelText("Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    it("verifies LGUSelectorModal dialog semantics, labelledby, and describedby", () => {
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
      expect(dialog).toHaveAttribute("aria-labelledby", "lgu-modal-title");
      expect(dialog).toHaveAttribute("aria-describedby", "lgu-modal-desc");

      expect(screen.getByText(/Select Area in Metro Manila/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 5. Keyboard Navigation & Focus Ring Enforcement (WCAG 2.4.7)
  // =========================================================================
  describe("5. Keyboard Navigation & Focus Visible Enforcement", () => {
    it("dispatches close callback when Escape key is pressed inside SavedItemsDrawer", () => {
      const handleClose = vi.fn();
      render(<SavedItemsDrawer isOpen={true} onClose={handleClose} />);

      fireEvent.keyDown(window, { key: "Escape" });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("verifies interactive buttons carry focus-visible outline classes with brand green #245C43", () => {
      render(<SavedItemsDrawer isOpen={true} />);

      const closeBtn = screen.getByTestId("saved-drawer-close");
      expect(closeBtn.className).toContain("focus-visible:outline-2");
      expect(closeBtn.className).toContain("focus-visible:outline-[#245C43]");
      expect(closeBtn.className).toContain("focus-visible:outline-offset-2");

      const tabAll = screen.getByTestId("tab-all");
      expect(tabAll.className).toContain("focus-visible:outline-[#245C43]");
    });
  });
});
