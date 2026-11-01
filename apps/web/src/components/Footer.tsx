"use client";

import React, { useState } from "react";
import Link from "next/link";
import { lunhawContent } from "@/content/lunhaw-content";
import { ArrowRight, Instagram, Facebook, Linkedin, Mail } from "lucide-react";

export function Footer() {
  const { footer, brand } = lunhawContent;
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

    if (isValid) {
      setIsSuccess(true);
      setMsg(footer.newsletterSuccess);
      setEmail("");
    } else {
      setIsSuccess(false);
      setMsg(footer.newsletterError);
    }
  };

  return (
    <footer className="bg-footer text-footer-fg py-16 md:py-20 border-t border-line/20">
      <div className="wrap flex flex-col gap-12">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-10 items-start">
          {/* Brand & Socials */}
          <div className="md:col-span-2 flex flex-col gap-5">
            <Link href="#top" className="flex items-center gap-2.5 text-white group" aria-label="Lunhaw home">
              <span className="mascot-img w-9 h-9" role="img" aria-label={brand.mascotAlt} />
              <span className="font-display text-2xl tracking-wide text-white leading-none">
                {brand.name}
              </span>
            </Link>
            <p className="text-footer-muted text-sm max-w-sm leading-relaxed">
              {footer.brandTagline}
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="#"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-lime hover:text-footer transition-colors flex items-center justify-center text-white"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-lime hover:text-footer transition-colors flex items-center justify-center text-white"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-lime hover:text-footer transition-colors flex items-center justify-center text-white"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="mailto:contact@lunhaw.ph"
                aria-label="Email"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-lime hover:text-footer transition-colors flex items-center justify-center text-white"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Pages Column */}
          <div className="flex flex-col gap-3.5">
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase">
              {footer.pagesTitle}
            </h4>
            <div className="flex flex-col gap-2.5">
              {footer.pages.map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="text-footer-muted hover:text-lime text-sm transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Legal Column */}
          <div className="flex flex-col gap-3.5">
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase">
              {footer.legalTitle}
            </h4>
            <div className="flex flex-col gap-2.5">
              {footer.legal.map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="text-footer-muted hover:text-lime text-sm transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Newsletter Column */}
          <div className="flex flex-col gap-3.5">
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase">
              {footer.newsletterTitle}
            </h4>
            <form onSubmit={handleSubmit} className="flex gap-2" noValidate>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={footer.newsletterPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-footer-muted text-sm focus:outline-none focus:ring-2 focus:ring-lime"
                aria-label={footer.newsletterPlaceholder}
                required
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="w-10 h-10 rounded-full bg-lime text-footer flex-none flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            {msg && (
              <p
                className={`text-xs mt-1 transition-opacity ${
                  isSuccess ? "text-lime" : "text-amber-line"
                }`}
                aria-live="polite"
              >
                {msg}
              </p>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-footer-muted">
          <span>{footer.copyright}</span>
          <span>{footer.subtext}</span>
        </div>
      </div>
    </footer>
  );
}
