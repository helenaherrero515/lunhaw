"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useLunhawStore } from "@/lib/store/use-lunhaw-store";
import { authService } from "@/lib/auth/auth-service";
export function Header() {
  const { isMobileMenuOpen, toggleMobileMenu, setMobileMenuOpen, openAuth, currentUser, setCurrentUser } =
    useLunhawStore();

  useEffect(() => {
    let isMounted = true;
    async function sync() {
      try {
        const u = await authService.getCurrentUser();
        if (isMounted && u) setCurrentUser(u);
      } catch {}
    }
    sync();
    return () => { isMounted = false; };
  }, [setCurrentUser]);

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
          <Link
            className="l"
            href="#faqs"
            data-scroll
            onClick={handleNavClick}
          >
            FAQs
          </Link>
          {currentUser ? (
            <Link
              className="btn sm"
              href="/home"
              onClick={handleNavClick}
            >
              Open App
            </Link>
          ) : (
            <button
              className="btn sm"
              type="button"
              data-auth="signup"
              onClick={handleCreateAccount}
            >
              Create Account
            </button>
          )}
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
