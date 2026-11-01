"use client";

import React from "react";
import Link from "next/link";
import { useLunhawStore } from "@/lib/store/use-lunhaw-store";

export function Header() {
  const { isMobileMenuOpen, toggleMobileMenu, setMobileMenuOpen, openAuth } =
    useLunhawStore();

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
            href="#about"
            data-scroll
            onClick={handleNavClick}
          >
            About
          </Link>
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
