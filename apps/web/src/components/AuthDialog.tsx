"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLunhawStore } from "@/lib/store/use-lunhaw-store";
import { authService } from "@/lib/auth/auth-service";

export function AuthDialog() {
  const router = useRouter();
  const { isAuthOpen, closeAuth, authMode, setAuthMode, setCurrentUser } = useLunhawStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Form values
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Error states
  const [errName, setErrName] = useState("");
  const [errEmail, setErrEmail] = useState("");
  const [errPass, setErrPass] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const isSignup = authMode === "signup";

  const copy = {
    signup: {
      title: "Create your account",
      sub: "Find your green space.",
      submit: "Create account",
      switchText: "Already have an account?",
      switchBtn: "Log in",
      passHint: "At least 8 characters",
    },
    login: {
      title: "Welcome back",
      sub: "Pick up where you left off.",
      submit: "Log in",
      switchText: "Need an account?",
      switchBtn: "Sign up",
      passHint: "Your password",
    },
  };

  const currentCopy = copy[authMode];

  const clearErrors = () => {
    setErrName("");
    setErrEmail("");
    setErrPass("");
    setServerError(null);
  };

  const handleClose = () => {
    closeAuth();
    setTimeout(() => {
      setIsDone(false);
      clearErrors();
      setShowPassword(false);
      setName("");
      setEmail("");
      setPassword("");
    }, 200);
  };

  const handleDone = () => {
    handleClose();
    try {
      router.push("/home");
    } catch {}
  };

  const handleModeSwitch = (newMode: "signup" | "login") => {
    setAuthMode(newMode);
    clearErrors();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    let hasError = false;

    if (isSignup && !name.trim()) {
      setErrName("Please enter your name.");
      hasError = true;
    }

    const emailTrim = email.trim();
    if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setErrEmail("Please enter a valid email.");
      hasError = true;
    }

    if (!password) {
      setErrPass("Please enter a password.");
      hasError = true;
    } else if (isSignup && password.length < 8) {
      setErrPass("Use at least 8 characters.");
      hasError = true;
    }

    if (hasError) return;

    try {
      let authRes;
      if (isSignup) {
        authRes = await authService.signUp(name.trim(), emailTrim, password);
      } else {
        authRes = await authService.logIn(emailTrim, password);
      }

      if (authRes.error) {
        setServerError(authRes.error);
        return;
      }

      if (authRes.user) {
        setCurrentUser(authRes.user);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("lunhaw.auth_user", JSON.stringify(authRes.user));
          } catch {}
        }
      }
      if (authMode === "login") {
        handleClose();
        try {
          router.push("/home");
        } catch {}
      } else {
        setIsDone(true);
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  if (!isAuthOpen) return null;

  return (
    <div
      className="auth open"
      id="auth"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="auth-card" role="document">
        <button
          className="auth-x"
          type="button"
          aria-label="Close"
          data-auth-close
          onClick={handleClose}
        >
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

        {!isDone ? (
          <div id="auth-main">
            <div className="auth-head">
              <span
                className="mascot"
                role="img"
                aria-label="Lunhaw grasshopper mascot"
              />
              <div>
                <h2 id="auth-title">{currentCopy.title}</h2>
                <p id="auth-sub">{currentCopy.sub}</p>
              </div>
            </div>

            <div className="auth-tabs" role="tablist" aria-label="Account">
              <button
                type="button"
                role="tab"
                data-mode="signup"
                aria-selected={isSignup}
                onClick={() => handleModeSwitch("signup")}
              >
                Sign up
              </button>
              <button
                type="button"
                role="tab"
                data-mode="login"
                aria-selected={!isSignup}
                onClick={() => handleModeSwitch("login")}
              >
                Log in
              </button>
            </div>

            <form id="auth-form" noValidate onSubmit={handleSubmit}>
              {isSignup && (
                <div className={`fld ${errName ? "bad" : ""}`} id="f-name">
                  <label htmlFor="a-name">Name</label>
                  <input
                    id="a-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <p className="err" id="e-name">
                    {errName}
                  </p>
                </div>
              )}

              <div className={`fld ${errEmail ? "bad" : ""}`} id="f-email">
                <label htmlFor="a-email">Email</label>
                <input
                  id="a-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="err" id="e-email">
                  {errEmail}
                </p>
              </div>

              <div className={`fld ${errPass ? "bad" : ""}`} id="f-pass">
                <label htmlFor="a-pass">Password</label>
                <div className="inp pw">
                  <input
                    id="a-pass"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    placeholder={currentCopy.passHint}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="show"
                    type="button"
                    id="a-show"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="err" id="e-pass">
                  {errPass}
                </p>
              </div>

              {serverError && (
                <p className="err text-center font-medium" style={{ color: "#B3261E" }}>
                  {serverError}
                </p>
              )}

              <button className="btn" type="submit" id="auth-submit">
                {currentCopy.submit}
              </button>
            </form>

            <p className="auth-switch">
              <span id="auth-switch-text">{currentCopy.switchText}</span>{" "}
              <button
                type="button"
                id="auth-switch"
                onClick={() =>
                  handleModeSwitch(isSignup ? "login" : "signup")
                }
              >
                {currentCopy.switchBtn}
              </button>
            </p>
          </div>
        ) : (
          <div className="auth-done" id="auth-done">
            <span
              className="mascot"
              role="img"
              aria-label="Lunhaw grasshopper mascot"
            />
            <h2 id="done-title">Welcome to Lunhaw!</h2>
            <p id="done-text">Your green space is waiting.</p>
            <button
              className="btn"
              type="button"
              data-auth-close
              id="go-app"
              onClick={handleDone}
            >
              Start exploring
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
