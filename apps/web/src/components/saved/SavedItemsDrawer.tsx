"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Bookmark,
  MapPin,
  Trash2,
  Navigation,
  Sparkles,
  TreePine,
  BookOpen,
  ArrowRight,
  Send,
  CheckCircle2,
  AlertCircle,
  Cloud,
  Clock,
  Compass,
} from "lucide-react";
import { useLunhawStore } from "@/lib/store/use-lunhaw-store";
import {
  useSavedBookmarks,
  type SavedPlaceItem,
  type SavedRouteItem,
} from "@/lib/hooks/useSavedBookmarks";
import { GreenIndexPill } from "@/components/green-index/GreenIndexPill";

export interface SavedItemsDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigateToPlace?: (place: SavedPlaceItem) => void;
  onNavigateToRoute?: (route: SavedRouteItem) => void;
  className?: string;
}

type TabType = "all" | "places" | "routes";

export function SavedItemsDrawer({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onNavigateToPlace,
  onNavigateToRoute,
  className = "",
}: SavedItemsDrawerProps) {
  const { isSavedDrawerOpen, closeSavedDrawer } = useLunhawStore();
  const isOpen = typeof controlledIsOpen === "boolean" ? controlledIsOpen : isSavedDrawerOpen;
  const handleClose = controlledOnClose || closeSavedDrawer;

  const {
    savedPlaces,
    savedRoutes,
    savedCount,
    savedPlacesCount,
    savedRoutesCount,
    removePlace,
    removeRoute,
    clearAll,
    syncWithCloud,
    isSyncing,
    lastSyncedAt,
  } = useSavedBookmarks();

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [syncEmail, setSyncEmail] = useState("");
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState("");
  const [isSubmittingSync, setIsSubmittingSync] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management & Escape key listener
  useEffect(() => {
    if (!isOpen) {
      setShowClearConfirm(false);
      setSyncStatus("idle");
      setSyncMessage("");
      return;
    }

    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose]);

  const handleClearAll = () => {
    clearAll();
    setShowClearConfirm(false);
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncEmail || !syncEmail.includes("@")) {
      setSyncStatus("error");
      setSyncMessage("Please enter a valid email address.");
      return;
    }

    setIsSubmittingSync(true);
    setSyncStatus("idle");
    setSyncMessage("");

    const res = await syncWithCloud(syncEmail);
    setIsSubmittingSync(false);

    if (res.success) {
      setSyncStatus("success");
      setSyncMessage("Magic link sent! Check your inbox to sync bookmarks across your devices.");
      setSyncEmail("");
    } else {
      setSyncStatus("error");
      setSyncMessage(res.error || "Failed to send magic link. Please try again.");
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.round(seconds / 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
    }
    return `${mins} min`;
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end bg-stone-900/50 backdrop-blur-sm transition-opacity duration-300 ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label="Saved Places and Trips"
      data-testid="saved-items-drawer"
    >
      {/* Slide-over Drawer Container */}
      <div
        ref={drawerRef}
        className="flex h-full w-full max-w-md flex-col bg-white text-stone-900 shadow-2xl transition-transform duration-300 ease-out"
        style={{
          borderLeft: "2px solid #245C43",
        }}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4 bg-[#F4F9F4]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#245C43] text-white">
              <Bookmark className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="saved-drawer-title"
                className="text-lg font-bold text-[#16261F] tracking-tight"
              >
                Saved Places & Trips
              </h2>
              <p className="text-xs font-medium text-[#245C43]">
                {savedCount} {savedCount === 1 ? "bookmark" : "bookmarks"} saved locally
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            aria-label="Close saved drawer"
            data-testid="saved-drawer-close"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition-colors hover:border-[#245C43] hover:bg-[#E8F5EE] hover:text-[#245C43] focus-visible:outline-2 focus-visible:outline-[#245C43] focus-visible:outline-offset-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="border-b border-stone-200 px-5 py-2.5 bg-stone-50">
          <div className="flex items-center justify-between gap-2">
            <div
              className="flex items-center gap-1.5"
              role="tablist"
              aria-label="Filter saved bookmarks"
            >
              <button
                type="button"
                role="tab"
                id="tab-all"
                aria-controls="panel-all"
                aria-selected={activeTab === "all"}
                data-testid="tab-all"
                onClick={() => setActiveTab("all")}
                className={`flex h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-[#245C43] focus-visible:outline-offset-2 ${
                  activeTab === "all"
                    ? "bg-[#245C43] text-white shadow-sm"
                    : "text-stone-700 hover:bg-stone-200/60"
                }`}
              >
                All
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === "all" ? "bg-white/20 text-white" : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {savedCount}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                id="tab-places"
                aria-controls="panel-places"
                aria-selected={activeTab === "places"}
                data-testid="tab-places"
                onClick={() => setActiveTab("places")}
                className={`flex h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-[#245C43] focus-visible:outline-offset-2 ${
                  activeTab === "places"
                    ? "bg-[#245C43] text-white shadow-sm"
                    : "text-stone-700 hover:bg-stone-200/60"
                }`}
              >
                Places
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === "places" ? "bg-white/20 text-white" : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {savedPlacesCount}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                id="tab-routes"
                aria-controls="panel-routes"
                aria-selected={activeTab === "routes"}
                data-testid="tab-routes"
                onClick={() => setActiveTab("routes")}
                className={`flex h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-[#245C43] focus-visible:outline-offset-2 ${
                  activeTab === "routes"
                    ? "bg-[#245C43] text-white shadow-sm"
                    : "text-stone-700 hover:bg-stone-200/60"
                }`}
              >
                Trips
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === "routes" ? "bg-white/20 text-white" : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {savedRoutesCount}
                </span>
              </button>
            </div>

            {savedCount > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                aria-label="Clear all saved bookmarks"
                data-testid="clear-all-saved-btn"
                className="flex h-11 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-stone-600 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-[#245C43] focus-visible:outline-offset-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clear all</span>
              </button>
            )}
          </div>
        </div>

        {/* Clear Confirmation Prompt */}
        {showClearConfirm && (
          <div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-xs text-rose-950">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Remove all {savedCount} saved items?</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex h-11 items-center justify-center rounded-lg bg-rose-700 px-3 font-semibold text-white hover:bg-rose-800 focus-visible:outline-2 focus-visible:outline-[#245C43] focus-visible:outline-offset-2"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex h-11 items-center justify-center rounded-lg border border-rose-300 bg-white px-3 font-semibold text-stone-700 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-[#245C43] focus-visible:outline-offset-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saved Items Content Area */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {savedCount === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 text-center"
              data-testid="saved-items-empty"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F5EE] text-[#245C43] mb-3">
                <Compass className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-[#16261F]">No saved items yet</h3>
              <p className="mt-1 max-w-xs text-xs text-stone-600 leading-relaxed">
                Save public libraries, reading centers, community parks, and shaded transit routes for quick access on any commute.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Places Section */}
              {(activeTab === "all" || activeTab === "places") && savedPlaces.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#245C43]">
                      Places & Study Centers ({savedPlaces.length})
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {savedPlaces.map((place) => (
                      <div
                        key={place.id}
                        data-testid={`saved-place-${place.id}`}
                        className="group relative rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm transition-all hover:border-[#245C43] hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 rounded-md bg-[#E8F5EE] px-2 py-0.5 text-[11px] font-semibold text-[#163B2B]">
                                {place.category === "park" ? (
                                  <TreePine className="h-3 w-3" />
                                ) : (
                                  <BookOpen className="h-3 w-3" />
                                )}
                                {place.category.replace("_", " ")}
                              </span>
                              {place.green_index_score != null && (
                                <GreenIndexPill score={place.green_index_score} size="sm" />
                              )}
                            </div>

                            <h4 className="mt-1.5 text-sm font-bold text-[#16261F] truncate">
                              {place.name}
                            </h4>

                            <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-600">
                              <MapPin className="h-3 w-3 flex-shrink-0 text-[#245C43]" />
                              <span className="truncate">
                                {place.barangay ? `${place.barangay}, ` : ""}
                                {place.city || "Metro Manila"}
                              </span>
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removePlace(place.id)}
                            aria-label={`Remove ${place.name} from saved`}
                            data-testid={`remove-place-${place.id}`}
                            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-stone-500 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-[#245C43] focus-visible:outline-offset-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {onNavigateToPlace && (
                          <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                onNavigateToPlace(place);
                                handleClose();
                              }}
                              aria-label={`View ${place.name} on map`}
                              data-testid={`navigate-place-${place.id}`}
                              className="flex h-11 items-center gap-1 rounded-xl bg-[#F4F9F4] px-3.5 text-xs font-bold text-[#163B2B] hover:bg-[#E8F5EE] focus-visible:outline-2 focus-visible:outline-[#245C43] focus-visible:outline-offset-2"
                            >
                              <span>View facility</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Routes Section */}
              {(activeTab === "all" || activeTab === "routes") && savedRoutes.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#245C43]">
                      Commute Routes & Trips ({savedRoutes.length})
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {savedRoutes.map((route) => (
                      <div
                        key={route.route_id}
                        data-testid={`saved-route-${route.route_id}`}
                        className="group relative rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm transition-all hover:border-[#245C43] hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-900 border border-emerald-200">
                                <Navigation className="h-3 w-3" />
                                Transit Trip
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-[#EEF5E8] px-2 py-0.5 text-[11px] font-bold text-[#245C43]">
                                <Sparkles className="h-3 w-3" />
                                {route.average_shade_score}% Shade
                              </span>
                            </div>

                            <h4 className="mt-1.5 text-sm font-bold text-[#16261F] truncate">
                              {route.title}
                            </h4>

                            <div className="mt-1 flex items-center gap-3 text-xs text-stone-600 font-medium">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-stone-500" />
                                {formatDuration(route.est_duration_seconds)}
                              </span>
                              <span>•</span>
                              <span>{formatDistance(route.total_distance_m)}</span>
                              {route.fare_php != null && (
                                <>
                                  <span>•</span>
                                  <span className="font-bold text-[#245C43]">₱{route.fare_php}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeRoute(route.route_id)}
                            aria-label={`Remove ${route.title} from saved`}
                            data-testid={`remove-route-${route.route_id}`}
                            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-stone-500 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-[#245C43] focus-visible:outline-offset-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {onNavigateToRoute && (
                          <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                onNavigateToRoute(route);
                                handleClose();
                              }}
                              aria-label={`Navigate ${route.title}`}
                              data-testid={`navigate-route-${route.route_id}`}
                              className="flex h-11 items-center gap-1 rounded-xl bg-[#F4F9F4] px-3.5 text-xs font-bold text-[#163B2B] hover:bg-[#E8F5EE] focus-visible:outline-2 focus-visible:outline-[#245C43] focus-visible:outline-offset-2"
                            >
                              <span>Open route</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Optional Supabase Magic-Link Auth Sync Section (C-M3-02 / F-005) */}
        <div
          className="border-t border-stone-200 bg-[#F4F9F4] p-4"
          data-testid="magic-link-sync-section"
        >
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="h-4 w-4 text-[#245C43]" />
            <span className="text-xs font-bold text-[#16261F]">
              Optional Cloud Sync
            </span>
          </div>
          <p className="text-[11px] text-stone-600 leading-snug mb-3">
            Bookmarks stay on this device by default. Enter your email to receive a passwordless Supabase Magic Link and sync across your phone and laptop.
          </p>

          <form onSubmit={handleMagicLinkSubmit} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={syncEmail}
                onChange={(e) => setSyncEmail(e.target.value)}
                placeholder="name@example.ph"
                aria-label="Email address for cloud sync"
                data-testid="magic-link-input"
                className="flex-1 h-11 rounded-xl border border-stone-300 bg-white px-3 text-xs text-stone-900 placeholder:text-stone-600 focus:border-[#245C43] focus:outline-none focus:ring-2 focus:ring-[#245C43]/20"
              />
              <button
                type="submit"
                disabled={isSubmittingSync || isSyncing}
                data-testid="magic-link-submit-btn"
                className="flex h-11 items-center gap-1.5 rounded-xl bg-[#245C43] px-3.5 text-xs font-bold text-white transition-colors hover:bg-[#163B2B] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#245C43] focus-visible:outline-offset-2"
              >
                {isSubmittingSync ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Send className="h-3 w-3" />
                    <span>Send Magic Link</span>
                  </>
                )}
              </button>
            </div>

            {syncStatus === "success" && (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-100 p-2 text-xs font-medium text-emerald-900">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-700" />
                <span>{syncMessage}</span>
              </div>
            )}

            {syncStatus === "error" && (
              <div className="flex items-center gap-1.5 rounded-lg bg-rose-100 p-2 text-xs font-medium text-rose-900">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-700" />
                <span>{syncMessage}</span>
              </div>
            )}

            {lastSyncedAt && (
              <p className="text-[10px] text-stone-600">
                Last synced: {new Date(lastSyncedAt).toLocaleTimeString()}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
