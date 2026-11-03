import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { FacilityProfile } from "@/components/places/FacilityProfile";
import { FACILITY_DISCLAIMER_COPY } from "@lunhaw/ui";
import type { Place, FacilityDetail } from "@/types/places";

const MOCK_LIBRARY: FacilityDetail = {
  id: "f0010000-0000-0000-0000-000000000001",
  name: "National Library of the Philippines (NLP) - Main Complex",
  category: "library",
  description:
    "The official national library of the Philippines with premier Filipiniana and public reading facilities.",
  city: "Manila",
  barangay: "Barangay 666",
  address: "T.M. Kalaw St, Ermita, Manila",
  coordinates: {
    lat: 14.5828,
    lng: 120.9822,
  },
  green_index_score: 74.2,
  verification: {
    status: "VERIFIED",
    official_source_name: "National Library Administration",
    official_source_url: "https://web.nlp.gov.ph",
    last_verified_at: "2026-10-15T08:00:00Z",
    verified_by: "Manila Civic Auditor",
  },
  study_amenities: {
    desk_capacity: 120,
    has_power_outlets: true,
    has_wifi: true,
    has_aircon: true,
    has_quiet_zone: true,
    is_free_to_use: true,
    verification: {
      status: "VERIFIED",
      official_source_name: "National Library Administration",
    },
    amenity_verifications: {
      desk_capacity: { status: "VERIFIED" },
      has_power_outlets: { status: "VERIFIED" },
      has_wifi: { status: "VERIFIED" },
      has_aircon: { status: "VERIFIED" },
      has_quiet_zone: { status: "VERIFIED" },
      is_free_to_use: { status: "VERIFIED" },
    },
  },
  access_requirements: "Valid student or government ID required for entry.",
  fee_description: "Free Admission",
  schedules: [
    {
      day_of_week: 1,
      day_name: "Monday",
      open_time: "08:00:00",
      close_time: "17:00:00",
      is_closed: false,
      verification: { status: "VERIFIED" },
    },
    {
      day_of_week: 2,
      day_name: "Tuesday",
      open_time: "08:00:00",
      close_time: "17:00:00",
      is_closed: false,
      verification: { status: "VERIFIED" },
    },
    {
      day_of_week: 3,
      day_name: "Wednesday",
      open_time: "08:00:00",
      close_time: "17:00:00",
      is_closed: false,
      verification: { status: "VERIFIED" },
    },
    {
      day_of_week: 4,
      day_name: "Thursday",
      open_time: "08:00:00",
      close_time: "17:00:00",
      is_closed: false,
      verification: { status: "VERIFIED" },
    },
    {
      day_of_week: 5,
      day_name: "Friday",
      open_time: "08:00:00",
      close_time: "17:00:00",
      is_closed: false,
      verification: { status: "VERIFIED" },
    },
    {
      day_of_week: 6,
      day_name: "Saturday",
      open_time: "08:00:00",
      close_time: "12:00:00",
      is_closed: false,
      verification: { status: "VERIFIED" },
    },
    {
      day_of_week: 0,
      day_name: "Sunday",
      open_time: null,
      close_time: null,
      is_closed: true,
      verification: { status: "VERIFIED" },
    },
  ],
};

const MOCK_UNVERIFIED_READING_CENTER: Place = {
  id: "f0010000-0000-0000-0000-000000000099",
  name: "Sitio Riverside Informal Study Corner",
  category: "reading_center",
  city: "Pasig",
  barangay: "Pinagbuhatan",
  address: "Riverside Alley, Pinagbuhatan, Pasig",
  coordinates: {
    lat: 14.56,
    lng: 121.09,
  },
  verification: {
    status: "ESTIMATE",
    derivation_note: "Extrapolated from community volunteer survey",
  },
  schedules: [],
};

describe("E-M1-02 / TC-002: Public Library Details & Amenity Display", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("Header & Civic Information Rendering", () => {
    it("renders facility name, category pill, address, and Green Index score", () => {
      render(<FacilityProfile facility={MOCK_LIBRARY} />);

      // Facility Name
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: /National Library of the Philippines/i,
        })
      ).toBeInTheDocument();

      // Category badge
      expect(screen.getByText("Public Library")).toBeInTheDocument();

      // Address
      expect(
        screen.getByText(/T\.M\. Kalaw St, Ermita, Manila/i)
      ).toBeInTheDocument();

      // Green Index Score
      expect(screen.getByLabelText(/Green Index: 74\.2/i)).toBeInTheDocument();

      // Description
      expect(
        screen.getByText(/premier Filipiniana and public reading facilities/i)
      ).toBeInTheDocument();
    });

    it("renders overall facility verification badge with VERIFIED status", () => {
      render(<FacilityProfile facility={MOCK_LIBRARY} />);

      const badges = screen.getAllByRole("status");
      expect(badges.length).toBeGreaterThan(0);

      // Main header badge should reflect VERIFIED
      const verifiedBadges = screen.getAllByLabelText("Verified data status");
      expect(verifiedBadges.length).toBeGreaterThan(0);
    });
  });

  describe("Study Amenity Chips Display (TC-002 / F-002)", () => {
    it("renders desk capacity with exact seat count and integrity status", () => {
      render(<FacilityProfile facility={MOCK_LIBRARY} />);

      const deskSection = screen.getByTestId("amenity-desk-capacity");
      expect(deskSection).toBeInTheDocument();
      expect(within(deskSection).getByText("Study Desks")).toBeInTheDocument();
      expect(
        within(deskSection).getByText("120 Desks Available")
      ).toBeInTheDocument();
      expect(
        within(deskSection).getByLabelText("Verified data status")
      ).toBeInTheDocument();
    });

    it("renders power outlets amenity chip with active availability and verification badge", () => {
      render(<FacilityProfile facility={MOCK_LIBRARY} />);

      const powerSection = screen.getByTestId("amenity-power");
      expect(powerSection).toBeInTheDocument();
      expect(within(powerSection).getByText("Power Outlets")).toBeInTheDocument();
      expect(
        within(powerSection).getByText("Available for Laptops")
      ).toBeInTheDocument();
      expect(
        within(powerSection).getByLabelText("Verified data status")
      ).toBeInTheDocument();
    });

    it("renders Wi-Fi amenity chip with verified status", () => {
      render(<FacilityProfile facility={MOCK_LIBRARY} />);

      const wifiSection = screen.getByTestId("amenity-wifi");
      expect(wifiSection).toBeInTheDocument();
      expect(within(wifiSection).getByText("Public Wi-Fi")).toBeInTheDocument();
      expect(
        within(wifiSection).getByText("Free Public Wi-Fi")
      ).toBeInTheDocument();
      expect(
        within(wifiSection).getByLabelText("Verified data status")
      ).toBeInTheDocument();
    });

    it("renders air conditioning chip", () => {
      render(<FacilityProfile facility={MOCK_LIBRARY} />);

      const airconSection = screen.getByTestId("amenity-aircon");
      expect(airconSection).toBeInTheDocument();
      expect(
        within(airconSection).getByText("Air Conditioning")
      ).toBeInTheDocument();
      expect(
        within(airconSection).getByText("Air-conditioned Room")
      ).toBeInTheDocument();
    });

    it("renders quiet zone and free admission chips", () => {
      render(<FacilityProfile facility={MOCK_LIBRARY} />);

      expect(screen.getByText("Quiet Study Zone")).toBeInTheDocument();
      expect(screen.getByText("Dedicated Quiet Area")).toBeInTheDocument();
      expect(screen.getByText("Admission")).toBeInTheDocument();
      expect(screen.getByText("Free Admission")).toBeInTheDocument();
    });

    it("renders 'Not available yet' with NOT_AVAILABLE badge for unknown amenities (INV-001)", () => {
      render(<FacilityProfile facility={MOCK_UNVERIFIED_READING_CENTER} />);

      const deskSection = screen.getByTestId("amenity-desk-capacity");
      expect(within(deskSection).getAllByText("Not available yet").length).toBeGreaterThan(0);
      expect(
        within(deskSection).getByLabelText("Not available yet data status")
      ).toBeInTheDocument();

      const powerSection = screen.getByTestId("amenity-power");
      expect(within(powerSection).getAllByText("Not available yet").length).toBeGreaterThan(0);
      expect(
        within(powerSection).getByLabelText("Not available yet data status")
      ).toBeInTheDocument();
    });
  });

  describe("Operating Hours Weekly Schedule Grid (TC-002)", () => {
    it("renders 7-day schedule with formatted 12-hour times and verification badges", () => {
      render(<FacilityProfile facility={MOCK_LIBRARY} />);

      const table = screen.getByRole("table", {
        name: /operating hours weekly schedule/i,
      });
      expect(table).toBeInTheDocument();

      // Monday through Saturday should display formatted operating hours
      expect(screen.getByText("Monday")).toBeInTheDocument();
      expect(screen.getAllByText("8:00 AM – 5:00 PM").length).toBeGreaterThan(0);

      // Saturday half day
      expect(screen.getByText("Saturday")).toBeInTheDocument();
      expect(screen.getByText("8:00 AM – 12:00 PM")).toBeInTheDocument();

      // Sunday closed badge
      expect(screen.getByText("Sunday")).toBeInTheDocument();
      expect(screen.getByText("Closed")).toBeInTheDocument();
    });

    it("displays honest fallback notice when facility operating hours are empty (INV-001)", () => {
      render(<FacilityProfile facility={MOCK_UNVERIFIED_READING_CENTER} />);

      expect(
        screen.getByText("Operating hours not available yet for this facility.")
      ).toBeInTheDocument();
      expect(screen.getAllByLabelText("Not available yet data status").length).toBeGreaterThan(0);
    });
  });

  describe("Mandatory Advisory Disclaimer Banner (INV-002 / TC-N02)", () => {
    it("renders the persistent disclaimer banner with exact copy", () => {
      render(<FacilityProfile facility={MOCK_LIBRARY} />);

      const disclaimerBanner = document.getElementById(
        "facility-disclaimer-banner"
      );
      expect(disclaimerBanner).toBeInTheDocument();
      expect(disclaimerBanner).toHaveTextContent(FACILITY_DISCLAIMER_COPY);
      expect(disclaimerBanner).toHaveTextContent(
        "Please verify operating hours directly with the facility before traveling"
      );
    });
  });

  describe("Interactive Save & Navigation Handlers (F-005 / TC-005)", () => {
    it("toggles saved state and updates localStorage upon button click", () => {
      const onToggleSave = vi.fn();
      render(
        <FacilityProfile
          facility={MOCK_LIBRARY}
          onToggleSave={onToggleSave}
        />
      );

      const saveButton = screen.getByRole("button", { name: /save facility/i });
      expect(saveButton).toBeInTheDocument();
      expect(saveButton).toHaveTextContent("Save");

      // Click to save
      fireEvent.click(saveButton);

      expect(onToggleSave).toHaveBeenCalledWith(MOCK_LIBRARY.id, true);
      expect(saveButton).toHaveTextContent("Saved");

      // Check localStorage persistence
      const stored = localStorage.getItem("lunhaw_saved_places");
      expect(stored).toBeDefined();
      expect(JSON.parse(stored!)).toContain(MOCK_LIBRARY.id);

      // Click again to unsave
      fireEvent.click(saveButton);
      expect(onToggleSave).toHaveBeenCalledWith(MOCK_LIBRARY.id, false);
      expect(saveButton).toHaveTextContent("Save");
    });

    it("calls onClose when close button is clicked", () => {
      const onClose = vi.fn();
      render(
        <FacilityProfile
          facility={MOCK_LIBRARY}
          onClose={onClose}
          showCloseButton={true}
        />
      );

      const closeButton = screen.getByRole("button", {
        name: /close facility details/i,
      });
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
