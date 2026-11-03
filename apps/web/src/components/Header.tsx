"use client";

import React from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { useLunhawStore } from "@/lib/store/use-lunhaw-store";
import { useSavedBookmarks } from "@/lib/hooks/useSavedBookmarks";

export function Header() {
  const { isMobileMenuOpen, toggleMobileMenu, setMobileMenuOpen, openAuth, openSavedDrawer } =
    useLunhawStore();
  const { savedCount } = useSavedBookmarks();

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  const handleCreateAccount = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    openAuth("signup");
  };

  return (
    <header className="top">
      <div className="wrap">
        <Link
          className="brand"
          href="#top"
          data-scroll
          aria-label="Lunhaw home"
          onClick={handleNavClick}
        >
          <span
            className="mascot"
            role="img"
            aria-label="Lunhaw grasshopper mascot"
          />
          <span className="wordmark">LUNHAW</span>
        </Link>
        <nav
          className={`nav ${isMobileMenuOpen ? "open" : ""}`}
          id="menu"
          aria-label="Main"
        >
          <Link
            className="l"
            href="/explore"
            onClick={handleNavClick}
          >
            Explore Map
          </Link>
          <Link
            className="l"
            href="#about"
            data-scroll
            onClick={handleNavClick}
          >
            About
          </Link>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              openSavedDrawer();
            }}
            aria-label={`View saved items (${savedCount})`}
            data-testid="header-saved-btn"
            className="relative inline-flex h-11 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 text-xs font-semibold text-[#245C43] transition-colors hover:border-[#245C43] hover:bg-[#E8F5EE] focus-visible:outline-2 focus-visible:outline-[#245C43] focus-visible:outline-offset-2"
          >
            <Bookmark className="h-4 w-4" />
            <span>Saved</span>
            {savedCount > 0 && (
              <span
                data-testid="header-saved-count-badge"
                className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#245C43] px-1.5 text-[10px] font-bold text-white"
              >
                {savedCount}
              </span>
            )}
          </button>
          <button
            className="btn sm"
            type="button"
            data-auth="signup"
            onClick={handleCreateAccount}
          >
            Create Account
          </button>
        </nav>
        <button
          className="menu-btn"
          type="button"
          aria-label="Menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="menu"
          onClick={toggleMobileMenu}
        >
          <i></i>
          <i></i>
          <i></i>
        </button>
      </div>
    </header>
  );
}
