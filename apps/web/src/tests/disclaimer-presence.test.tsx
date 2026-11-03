import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  FacilityDisclaimerBanner,
  FACILITY_DISCLAIMER_COPY,
} from "@lunhaw/ui";
import { FacilityProfile } from "@/components/places/FacilityProfile";
import type { Place, FacilityDetail, PlaceCategory } from "@/types/places";
import seedData from "../../../../data/seed-libraries.json";

/**
 * E-M1-04 / TC-N02: Negative Invariant Test for Mandatory Advisory Disclaimer Banner (INV-002 / BR-005)
 *
 * Invariant INV-002: Never render facility profiles without the mandatory advisory disclaimer banner.
 * EARS Unwanted Assertion: The system SHALL NEVER display a facility profile view WHERE the mandatory
 * advisory disclaimer text is missing or hidden.
 */
describe("E-M1-04 / TC-N02: Mandatory Disclaimer Presence Invariant (INV-002)", () => {
  const mandatorySubstrings = [
    "Please verify operating hours directly with the facility before traveling",
    "as local barangay schedules may change without notice",
  ];

  const testFacilities: FacilityDetail[] = [
    {
      id: "f-library-01",
      name: "Manila City Library - Main Branch",
      category: "library",
      city: "Manila",
      barangay: "Barangay 659",
      address: "Mehan Garden, Antonio Villegas St, Ermita, Manila",
      coordinates: { lat: 14.5935, lng: 120.9818 },
      verification: { status: "VERIFIED" },
      study_amenities: {
        has_power_outlets: true,
        has_wifi: true,
        has_aircon: true,
      },
      schedules: [
        {
          day_of_week: 1,
          day_name: "Monday",
          open_time: "08:00:00",
          close_time: "17:00:00",
          is_closed: false,
          verification: { status: "VERIFIED" },
        },
      ],
    },
    {
      id: "f-reading-02",
      name: "Barangay San Antonio Reading Center",
      category: "reading_center",
      city: "Pasig",
      barangay: "San Antonio",
      address: "San Antonio Community Complex, Pasig",
      coordinates: { lat: 14.5823, lng: 121.0611 },
      verification: { status: "VERIFIED" },
      schedules: [],
    },
    {
      id: "f-park-03",
      name: "Arroceros Forest Park",
      category: "park",
      city: "Manila",
      barangay: "Barangay 659",
      address: "Antonio Villegas St, Ermita, Manila",
      coordinates: { lat: 14.5947, lng: 120.9822 },
      verification: { status: "VERIFIED" },
    },
    {
      id: "f-garden-04",
      name: "Valenzuela Community Garden & Haven",
      category: "garden",
      city: "Valenzuela",
      barangay: "Karuhatan",
      address: "MacArthur Hwy, Karuhatan, Valenzuela",
      coordinates: { lat: 14.6853, lng: 120.9781 },
      verification: { status: "ESTIMATE", derivation_note: "Field report" },
    },
    {
      id: "f-unverified-05",
      name: "Unverified Civic Study Hall",
      category: "civic_space",
      city: "Caloocan",
      barangay: "Grace Park",
      address: "Grace Park, Caloocan",
      coordinates: { lat: 14.65, lng: 120.983 },
      verification: { status: "NOT_AVAILABLE" },
    },
  ];

  describe("FacilityDisclaimerBanner Standalone Invariant Checks", () => {
    it("renders with exact standard copy and accessible semantics", () => {
      render(<FacilityDisclaimerBanner />);

      const banner = document.getElementById("facility-disclaimer-banner");
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveAttribute("role", "note");
      expect(banner).toHaveAttribute(
        "aria-label",
        "Facility operating hours disclaimer"
      );

      for (const substring of mandatorySubstrings) {
        expect(banner).toHaveTextContent(substring);
      }
      expect(banner?.textContent).toBe(
        `Advisory: ${FACILITY_DISCLAIMER_COPY}`
      );
    });

    it("does not render with hidden attributes or aria-hidden true", () => {
      render(<FacilityDisclaimerBanner />);

      const banner = document.getElementById("facility-disclaimer-banner");
      expect(banner).not.toHaveAttribute("hidden");
      expect(banner).not.toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Universal Presence Across All Facility Categories in FacilityProfile", () => {
    for (const facility of testFacilities) {
      it(`asserts disclaimer banner is present when rendering category: ${facility.category} (${facility.name})`, () => {
        const { unmount } = render(<FacilityProfile facility={facility} />);

        const banner = document.getElementById("facility-disclaimer-banner");
        expect(
          banner,
          `Mandatory disclaimer banner missing for facility: ${facility.name}`
        ).toBeInTheDocument();

        expect(banner).toHaveTextContent(
          "Please verify operating hours directly with the facility before traveling"
        );

        unmount();
      });
    }
  });

  describe("Verification with Sample Seed Facilities (data/seed-libraries.json)", () => {
    it("asserts persistent disclaimer banner on first 10 facilities from seed dataset", () => {
      const samplePlaces = (seedData.places as Array<{
        id: string;
        name: string;
        category: string;
        lgu_city: string;
        barangay: string;
        address: string;
        coordinates: { lat: number; lng: number };
      }>).slice(0, 10);

      expect(samplePlaces.length).toBeGreaterThan(0);

      for (const rawPlace of samplePlaces) {
        const place: Place = {
          id: rawPlace.id,
          name: rawPlace.name,
          category: rawPlace.category as PlaceCategory,
          city: rawPlace.lgu_city,
          barangay: rawPlace.barangay,
          address: rawPlace.address,
          coordinates: rawPlace.coordinates,
          verification: { status: "VERIFIED" },
        };

        const { unmount } = render(<FacilityProfile facility={place} />);

        const banner = document.getElementById("facility-disclaimer-banner");
        expect(
          banner,
          `Disclaimer banner missing on seeded facility: ${place.name}`
        ).toBeInTheDocument();

        expect(banner?.textContent).toContain(
          "Please verify operating hours directly with the facility before traveling"
        );

        unmount();
      }
    });
  });

  describe("Negative Invariant Guardrail Probes (INV-002)", () => {
    it("fails invariant check if disclaimer banner element is removed from profile view", () => {
      // Simulating a hypothetical broken/tampered component without the disclaimer banner
      const TamperedProfileWithoutDisclaimer = () => (
        <article data-testid="tampered-profile">
          <h1>Test Facility</h1>
          <p>No disclaimer here</p>
        </article>
      );

      render(<TamperedProfileWithoutDisclaimer />);

      // Invariant assertion: #facility-disclaimer-banner MUST exist
      const banner = document.getElementById("facility-disclaimer-banner");
      expect(banner).toBeNull();

      // Invariant validator function:
      const validateDisclaimerPresence = (container: HTMLElement) => {
        const el = container.querySelector("#facility-disclaimer-banner");
        if (!el || !el.textContent?.includes("Please verify operating hours directly with the facility")) {
          throw new Error("INV-002 Violation: Mandatory facility disclaimer banner is missing or altered.");
        }
        return true;
      };

      const container = screen.getByTestId("tampered-profile");
      expect(() => validateDisclaimerPresence(container)).toThrow(
        /INV-002 Violation/
      );
    });

    it("fails invariant check if disclaimer text is altered or stripped", () => {
      const TamperedProfileWithAlteredCopy = () => (
        <article data-testid="altered-profile">
          <div id="facility-disclaimer-banner">
            <span>Hours are guaranteed and never change.</span>
          </div>
        </article>
      );

      render(<TamperedProfileWithAlteredCopy />);

      const validateDisclaimerCopy = (container: HTMLElement) => {
        const el = container.querySelector("#facility-disclaimer-banner");
        if (
          !el ||
          !el.textContent?.includes(
            "Please verify operating hours directly with the facility before traveling"
          )
        ) {
          throw new Error("INV-002 Violation: Advisory disclaimer text has been modified or falsified.");
        }
        return true;
      };

      const container = screen.getByTestId("altered-profile");
      expect(() => validateDisclaimerCopy(container)).toThrow(
        /INV-002 Violation/
      );
    });
  });
});
