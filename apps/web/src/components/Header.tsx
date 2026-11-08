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
    authService
      .getCurrentUser()
      .then((u) => {
        if (isMounted && u) setCurrentUser(u);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [setCurrentUser]);

  // Escape closes the mobile menu
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isMobileMenuOpen, setMobileMenuOpen]);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="top">
      <div className="wrap">
        <a className="brand" href="#top" data-scroll aria-label="Lunhaw home" onClick={closeMenu}>
          <span className="mascot" role="img" aria-label="Lunhaw grasshopper mascot" />
          <span className="wordmark">LUNHAW</span>
        </a>
        <nav className={`nav${isMobileMenuOpen ? " open" : ""}`} id="menu" aria-label="Main">
          <a className="l" href="#about" data-scroll onClick={closeMenu}>
            About
          </a>
          {currentUser ? (
            <Link className="btn sm" href="/home" onClick={closeMenu}>
              Open App
            </Link>
          ) : (
            <button
              className="btn sm"
              type="button"
              data-auth="signup"
              onClick={() => {
                closeMenu();
                openAuth("signup");
              }}
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
