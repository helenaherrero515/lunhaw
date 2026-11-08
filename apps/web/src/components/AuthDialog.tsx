"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLunhawStore } from "@/lib/store/use-lunhaw-store";
import { authService } from "@/lib/auth/auth-service";

type Mode = "signup" | "login" | "recovery" | "update_password";
type Field = "name" | "email" | "pass";
type Errors = Partial<Record<Field, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COPY = {
  signup: {
    title: "Create your account",
    sub: "Find your green space.",
    submit: "Create account",
    switchText: "Already have an account?",
    switchBtn: "Log in",
    passHint: "At least 8 characters",
    doneTitle: "Welcome to Lunhaw!",
    doneText: "Your green space is waiting.",
  },
  login: {
    title: "Welcome back",
    sub: "Log in to continue.",
    submit: "Log in",
    switchText: "New to Lunhaw?",
    switchBtn: "Sign up",
    passHint: "Your password",
    doneTitle: "Welcome back!",
    doneText: "You’re logged in.",
  },
  recovery: {
    title: "Reset your password",
    sub: "Enter your email to receive a reset link.",
    submit: "Send reset link",
    switchText: "Remembered your password?",
    switchBtn: "Log in",
    passHint: "",
    doneTitle: "Check your email",
    doneText: "We sent a password reset link to choose a new one.",
  },
  update_password: {
    title: "Choose a new password",
    sub: "Enter at least 8 characters.",
    submit: "Update password",
    switchText: "Never mind?",
    switchBtn: "Log in",
    passHint: "At least 8 characters",
    doneTitle: "Password updated!",
    doneText: "Your new password is set. You’re ready to explore.",
  },
} as const;

export function AuthDialog() {
  const { isAuthOpen, closeAuth, authMode, setAuthMode, setCurrentUser } = useLunhawStore();
  const rootRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLAnchorElement>(null);
  const doneButtonRef = useRef<HTMLButtonElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [doneMode, setDoneMode] = useState<Mode | null>(null);
  // Set when sign-up needs the emailed confirmation link before the account can be used.
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  const isSignup = authMode === "signup";
  const isRecovery = authMode === "recovery";
  const isUpdatePassword = authMode === "update_password";
  const copy = COPY[authMode];

  // Opening: reset the form, lock page scroll, focus the first field.
  // Closing/unmounting: unlock scroll and return focus to whatever opened the dialog.
  useEffect(() => {
    if (!isAuthOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setErrors({});
    setServerError(null);
    setPending(false);
    setDoneMode(null);
    setConfirmEmail(null);
    html.style.overflow = "hidden";
    const openedAs = useLunhawStore.getState().authMode;
    const t = window.setTimeout(() => (openedAs === "signup" ? nameRef : emailRef).current?.focus(), 30);
    return () => {
      window.clearTimeout(t);
      html.style.overflow = "";
      if (opener?.isConnected) opener.focus();
    };
  }, [isAuthOpen]);

  // Escape closes; Tab stays inside the dialog.
  useEffect(() => {
    if (!isAuthOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAuth();
        return;
      }
      if (e.key !== "Tab" || !rootRef.current) return;
      const focusable = Array.from(
        rootRef.current.querySelectorAll<HTMLElement>("button, input, a[href]")
      ).filter((el) => el.offsetParent !== null && !(el as HTMLButtonElement).disabled);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isAuthOpen, closeAuth]);

  // The form (and its focused submit button) is replaced by the success view; keep focus in the dialog.
  useEffect(() => {
    if (doneMode) (doneButtonRef.current ?? doneRef.current)?.focus();
  }, [doneMode, confirmEmail]);

  const switchMode = (m: Mode) => {
    setAuthMode(m);
    setErrors({});
    setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setServerError(null);

    const emailTrim = email.trim();
    const next: Errors = {};
    if (isSignup && !name.trim()) next.name = "Please enter your name.";
    if (!isUpdatePassword && !EMAIL_RE.test(emailTrim)) next.email = "Please enter a valid email.";
    if (isRecovery) {
      // Password not needed for recovery request
    } else if (isSignup || isUpdatePassword ? password.length < 8 : !password) {
      next.pass = (isSignup || isUpdatePassword) ? "Use at least 8 characters." : "Please enter your password.";
    }
    setErrors(next);
    if (next.name || next.email || next.pass) {
      (next.name ? nameRef : next.email ? emailRef : passRef).current?.focus();
      return;
    }

    setPending(true);
    try {
      if (isRecovery) {
        const res = await authService.resetPasswordForEmail(emailTrim);
        if (res.error) {
          setServerError(res.error);
          return;
        }
        setConfirmEmail(emailTrim);
        setDoneMode(authMode);
        return;
      }
      if (isUpdatePassword) {
        const res = await authService.updatePassword(password);
        if (res.error) {
          setServerError(res.error);
          return;
        }
        setDoneMode(authMode);
        return;
      }
      const res = isSignup
        ? await authService.signUp(name.trim(), emailTrim, password)
        : await authService.logIn(emailTrim, password);
      if (res.error) {
        setServerError(res.error);
        return;
      }
      if (res.needsEmailConfirmation) {
        setConfirmEmail(emailTrim);
        setDoneMode(authMode);
        return;
      }
      if (res.user) setCurrentUser(res.user);
      setDoneMode(authMode);
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setPending(false);
    }
  };

  if (!isAuthOpen) return null;

  return (
    <div
      ref={rootRef}
      className="auth open"
      id="auth"
      role="dialog"
      aria-modal="true"
      aria-labelledby={doneMode ? "done-title" : "auth-title"}
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuth();
      }}
    >
      <div className="auth-card">
        <button className="auth-x" type="button" aria-label="Close" data-auth-close onClick={closeAuth}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {doneMode && confirmEmail ? (
          <div className="auth-done" id="auth-done">
            <span className="mascot" role="img" aria-label="Lunhaw grasshopper mascot" />
            <h2 id="done-title">Check your email</h2>
            <p id="done-text">
              {doneMode === "recovery" ? (
                <>We sent a password reset link to <b>{confirmEmail}</b>. Open it to choose a new password.</>
              ) : (
                <>We sent a confirmation link to <b>{confirmEmail}</b>. Open it to finish creating your account.</>
              )}
            </p>
            <button ref={doneButtonRef} className="btn" type="button" data-auth-close onClick={closeAuth}>
              Done
            </button>
          </div>
        ) : doneMode ? (
          <div className="auth-done" id="auth-done">
            <span className="mascot" role="img" aria-label="Lunhaw grasshopper mascot" />
            <h2 id="done-title">{COPY[doneMode].doneTitle}</h2>
            <p id="done-text">{COPY[doneMode].doneText}</p>
            <Link ref={doneRef} className="btn" href="/home" onClick={closeAuth}>
              Open my account
            </Link>
            <button className="btn ghost" type="button" data-auth-close onClick={closeAuth}>
              Stay on this page
            </button>
          </div>
        ) : (
          <div id="auth-main">
            <div className="auth-head">
              <span className="mascot" role="img" aria-label="Lunhaw grasshopper mascot" />
              <div>
                <h2 id="auth-title">{copy.title}</h2>
                <p id="auth-sub">{copy.sub}</p>
              </div>
            </div>

            {!isRecovery && !isUpdatePassword && (
              <div className="auth-tabs" role="tablist" aria-label="Account">
                <button
                  type="button"
                  role="tab"
                  data-mode="signup"
                  aria-selected={isSignup}
                  onClick={() => switchMode("signup")}
                >
                  Sign up
                </button>
                <button
                  type="button"
                  role="tab"
                  data-mode="login"
                  aria-selected={!isSignup}
                  onClick={() => switchMode("login")}
                >
                  Log in
                </button>
              </div>
            )}

            <form id="auth-form" noValidate onSubmit={handleSubmit}>
              {isSignup && (
                <div className={`fld${errors.name ? " bad" : ""}`} id="f-name">
                  <label htmlFor="a-name">Name</label>
                  <input
                    ref={nameRef}
                    id="a-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <p className="err" id="e-name">
                    {errors.name}
                  </p>
                </div>
              )}
              {!isUpdatePassword && (
                <div className={`fld${errors.email ? " bad" : ""}`} id="f-email">
                  <label htmlFor="a-email">Email</label>
                  <input
                    ref={emailRef}
                    id="a-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="err" id="e-email">
                    {errors.email}
                  </p>
                </div>
              )}
              {!isRecovery && (
                <div className={`fld${errors.pass ? " bad" : ""}`} id="f-pass">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label htmlFor="a-pass">{isUpdatePassword ? "New password" : "Password"}</label>
                    {authMode === "login" && (
                      <button
                        type="button"
                        style={{ background: "none", border: "none", padding: 0, fontSize: "12px", color: "#55605A", textDecoration: "underline", cursor: "pointer" }}
                        onClick={() => switchMode("recovery")}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="inp pw">
                    <input
                      ref={passRef}
                      id="a-pass"
                      type={showPassword ? "text" : "password"}
                      autoComplete={isSignup || isUpdatePassword ? "new-password" : "current-password"}
                      placeholder={copy.passHint}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      className="show"
                      type="button"
                      id="a-show"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className="err" id="e-pass">
                    {errors.pass}
                  </p>
                </div>
              )}
              {serverError && (
                <p role="alert" style={{ color: "#B3261E", fontSize: 14, textAlign: "center" }}>
                  {serverError}
                </p>
              )}

              <button className="btn" type="submit" id="auth-submit" disabled={pending} aria-busy={pending}>
                {copy.submit}
              </button>
              {isSignup && (
                <p className="auth-legal">
                  By creating an account you agree to the <a href="/terms">Terms of Use</a> and acknowledge the{" "}
                  <a href="/privacy">Privacy Notice</a>.
                </p>
              )}
            </form>

            <p className="auth-switch">
              <span id="auth-switch-text">{copy.switchText}</span>{" "}
              <button
                type="button"
                id="auth-switch"
                onClick={() => switchMode(isSignup ? "login" : isRecovery || isUpdatePassword ? "login" : "signup")}
              >
                {copy.switchBtn}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
