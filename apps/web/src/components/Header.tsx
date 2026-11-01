"use client";

import React from "react";
import Link from "next/link";
import { lunhawContent } from "@/content/lunhaw-content";
import { useLunhawStore } from "@/lib/store/use-lunhaw-store";

export function Header() {
  const { isMobileMenuOpen, toggleMobileMenu, setMobileMenuOpen, openAuth } =
    useLunhawStore();
  const { brand, nav } = lunhawContent;

  return (
    <header className="sticky top-0 z-50 bg-[#F7F7F0]/90 backdrop-blur-md border-b border-[#DDE5DF]/60 transition-all">
      <div className="wrap flex items-center justify-between gap-4 py-3">
        {/* Brand */}
        <Link
          href="#top"
          className="flex items-center gap-2.5 text-[#245C43] group"
          aria-label="Lunhaw home"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span
            className="mascot-img w-10 h-10 shadow-sm transition-transform group-hover:scale-105"
            role="img"
            aria-label={brand.mascotAlt}
          />
          <span className="font-display text-2xl md:text-[28px] tracking-wide text-[#245C43] leading-none">
            {brand.name}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-6" aria-label="Main navigation">
          <Link
            href="#about"
            className="text-fg font-medium text-[15px] hover:text-primary transition-colors py-2 px-1"
          >
            {nav.about}
          </Link>
          <button
            type="button"
            onClick={() => openAuth("signup")}
            className="btn-lunhaw sm font-medium text-sm"
          >
            {nav.createAccount}
          </button>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          className="sm:hidden flex flex-col justify-center items-center w-10 h-10 rounded-full border border-line bg-surface text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
        >
          <span
            className={`block w-5 h-0.5 bg-fg rounded-full transition-transform duration-300 ${
              isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-fg rounded-full my-1 transition-opacity duration-300 ${
              isMobileMenuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-fg rounded-full transition-transform duration-300 ${
              isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div
          id="mobile-menu"
          className="sm:hidden border-b border-line bg-surface/95 backdrop-blur-lg px-6 py-5 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-2 duration-200"
        >
          <Link
            href="#about"
            className="text-fg font-semibold text-lg hover:text-primary py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            {nav.about}
          </Link>
          <Link
            href="#journey"
            className="text-fg font-semibold text-lg hover:text-primary py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Journey
          </Link>
          <Link
            href="#features"
            className="text-fg font-semibold text-lg hover:text-primary py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Features
          </Link>
          <div className="pt-2 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openAuth("signup");
              }}
              className="btn-lunhaw w-full text-center"
            >
              {nav.createAccount}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openAuth("login");
              }}
              className="btn-lunhaw ghost sm w-full text-center"
            >
              {nav.logIn}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
