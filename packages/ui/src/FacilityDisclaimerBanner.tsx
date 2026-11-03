import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "./utils";

export const FACILITY_DISCLAIMER_COPY =
  "Please verify operating hours directly with the facility before traveling, as local barangay schedules may change without notice.";

export interface FacilityDisclaimerBannerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  facilityName?: string;
}

export const FacilityDisclaimerBanner = React.forwardRef<
  HTMLDivElement,
  FacilityDisclaimerBannerProps
>(({ className, facilityName, id = "facility-disclaimer-banner", ...props }, ref) => {
  return (
    <div
      ref={ref}
      id={id}
      role="note"
      aria-label="Facility operating hours disclaimer"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-[#B45309]/40 bg-[#FFF4DF] p-3.5 text-sm text-[#7A3E06] shadow-sm md:p-4",
        className
      )}
      {...props}
    >
      <AlertTriangle
        className="mt-0.5 h-4 w-4 shrink-0 text-[#B45309]"
        aria-hidden="true"
      />
      <div className="flex-1 leading-relaxed">
        <span className="font-semibold text-[#663102]">Advisory: </span>
        <span>{FACILITY_DISCLAIMER_COPY}</span>
      </div>
    </div>
  );
});

FacilityDisclaimerBanner.displayName = "FacilityDisclaimerBanner";
