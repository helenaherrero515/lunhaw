import * as React from "react";
import { CheckCircle, HelpCircle, MinusCircle } from "lucide-react";
import { cn } from "./utils";

export type VerificationStatus = "VERIFIED" | "ESTIMATE" | "NOT_AVAILABLE";

export interface VerificationBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: VerificationStatus;
  sourceName?: string | null;
  derivationNote?: string | null;
  lastVerifiedAt?: string | Date | null;
  showTooltip?: boolean;
}

const STATUS_CONFIG = {
  VERIFIED: {
    label: "Verified",
    icon: CheckCircle,
    badgeClasses: "bg-[#DCFCE7] text-[#166534] border-[#86EFAC] hover:bg-[#BBF7D0]",
    iconClasses: "text-[#166534]",
    tooltipBorder: "border-[#86EFAC]",
    defaultNote: "Verified official record",
  },
  ESTIMATE: {
    label: "Estimate",
    icon: HelpCircle,
    badgeClasses: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] hover:bg-[#FDE68A]",
    iconClasses: "text-[#92400E]",
    tooltipBorder: "border-[#FDE68A]",
    defaultNote: "Estimated value based on heuristic or community data",
  },
  NOT_AVAILABLE: {
    label: "Not available yet",
    icon: MinusCircle,
    badgeClasses: "bg-[#F1F5F9] text-[#475569] border-[#CBD5E1] hover:bg-[#E2E8F0]",
    iconClasses: "text-[#475569]",
    tooltipBorder: "border-[#CBD5E1]",
    defaultNote: "No official verification or estimate is available yet",
  },
} as const;


export const VerificationBadge = React.forwardRef<HTMLDivElement, VerificationBadgeProps>(
  (
    {
      status,
      sourceName,
      derivationNote,
      lastVerifiedAt,
      showTooltip = true,
      className,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const tooltipId = React.useId();
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.NOT_AVAILABLE;
    const Icon = config.icon;

    const formattedDate = lastVerifiedAt
      ? (() => {
          try {
            const d = typeof lastVerifiedAt === "string" ? new Date(lastVerifiedAt) : lastVerifiedAt;
            return isNaN(d.getTime()) ? String(lastVerifiedAt) : d.toISOString().split("T")[0];
          } catch {
            return String(lastVerifiedAt);
          }
        })()
      : null;

    let tooltipContent: React.ReactNode = null;
    if (status === "VERIFIED") {
      tooltipContent = (
        <div className="space-y-1 text-xs">
          <p className="font-semibold">{config.label}</p>
          {sourceName && (
            <p>
              <span className="font-medium">Source:</span> {sourceName}
            </p>
          )}
          {formattedDate && (
            <p>
              <span className="font-medium">Audited:</span> {formattedDate}
            </p>
          )}
          {!sourceName && !formattedDate && <p>{config.defaultNote}</p>}
        </div>
      );
    } else if (status === "ESTIMATE") {
      tooltipContent = (
        <div className="space-y-1 text-xs">
          <p className="font-semibold">{config.label}</p>
          <p>
            <span className="font-medium">Derivation:</span>{" "}
            {derivationNote || config.defaultNote}
          </p>
        </div>
      );
    } else {
      tooltipContent = (
        <div className="space-y-1 text-xs">
          <p className="font-semibold">{config.label}</p>
          <p>{config.defaultNote}</p>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role="status"
        tabIndex={0}
        aria-label={`${config.label} data status`}
        aria-describedby={showTooltip ? tooltipId : undefined}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setIsOpen(false);
        }}
        className={cn(
          "group relative inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-[#245C43] focus:ring-offset-1 cursor-default select-none",
          config.badgeClasses,
          className
        )}
        {...props}
      >
        <Icon className={cn("h-3.5 w-3.5 shrink-0", config.iconClasses)} aria-hidden="true" />
        <span>{config.label}</span>

        {showTooltip && (
          <div
            id={tooltipId}
            role="tooltip"
            aria-hidden={!isOpen}
            className={cn(
              "pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-xs -translate-x-1/2 rounded-md bg-[#1E293B] p-2.5 text-white shadow-lg border border-slate-700 transition-opacity duration-150",
              isOpen
                ? "opacity-100 visible pointer-events-auto"
                : "opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-visible:opacity-100 group-focus-visible:visible"
            )}
          >
            {tooltipContent}
            {/* Tooltip caret */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1E293B]" />
          </div>
        )}
      </div>
    );
  }
);

VerificationBadge.displayName = "VerificationBadge";
