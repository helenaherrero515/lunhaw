"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLunhawStore } from "@/lib/store/use-lunhaw-store";
import { authService } from "@/lib/auth/auth-service";
import { lunhawContent } from "@/content/lunhaw-content";
import { X, Eye, EyeOff } from "lucide-react";

const signupSchema = z.object({
  name: z.string().min(1, { message: "Please enter your name." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Use at least 8 characters." }),
});

const loginSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Please enter your password." }),
});

type AuthFormData = {
  name?: string;
  email: string;
  password: string;
};

export function AuthDialog() {
  const { isAuthOpen, closeAuth, authMode, setAuthMode } = useLunhawStore();
  const { auth, brand } = lunhawContent;
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isSignup = authMode === "signup";
  const schema = isSignup ? signupSchema : loginSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const onSubmit = async (data: AuthFormData) => {
    setServerError(null);
    try {
      if (isSignup) {
        const res = await authService.signUp(data.name || "", data.email, data.password);
        if (res.error) {
          setServerError(res.error);
          return;
        }
      } else {
        const res = await authService.logIn(data.email, data.password);
        if (res.error) {
          setServerError(res.error);
          return;
        }
      }
      setIsSuccess(true);
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  const handleModeChange = (mode: "signup" | "login") => {
    setAuthMode(mode);
    setServerError(null);
    setIsSuccess(false);
    reset();
  };

  const handleClose = () => {
    closeAuth();
    setTimeout(() => {
      setIsSuccess(false);
      setServerError(null);
      reset();
      setShowPassword(false);
    }, 200);
  };

  return (
    <Dialog.Root open={isAuthOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#14241C]/60 backdrop-blur-sm transition-opacity" />

        {/* Modal Surface (Center on desktop, Bottom Sheet on mobile) */}
        <Dialog.Content
          className="fixed z-50 bottom-0 sm:bottom-auto sm:top-1/2 left-1/2 -translate-x-1/2 sm:-translate-y-1/2 w-full max-w-md bg-surface p-6 sm:p-8 rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-line focus:outline-none max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
          aria-labelledby="auth-dialog-title"
        >
          {/* Close button */}
          <Dialog.Close
            onClick={handleClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-bg hover:bg-mint/40 text-muted hover:text-fg flex items-center justify-center transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </Dialog.Close>

          {!isSuccess ? (
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex items-center gap-3.5">
                <span
                  className="mascot-img w-11 h-11 shadow-sm"
                  role="img"
                  aria-label={brand.mascotAlt}
                />
                <div>
                  <Dialog.Title
                    id="auth-dialog-title"
                    className="text-2xl font-bold font-display text-fg leading-tight"
                  >
                    {isSignup ? auth.signupTitle : auth.loginTitle}
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-muted">
                    {isSignup ? auth.signupSub : auth.loginSub}
                  </Dialog.Description>
                </div>
              </div>

              {/* Tabs */}
              <div
                className="grid grid-cols-2 p-1 rounded-full bg-bg border border-line"
                role="tablist"
                aria-label="Account Mode"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={isSignup}
                  onClick={() => handleModeChange("signup")}
                  className={`py-2 text-sm font-semibold rounded-full transition-all ${
                    isSignup
                      ? "bg-surface text-primary shadow-sm"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  {auth.buttons.signup}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isSignup}
                  onClick={() => handleModeChange("login")}
                  className={`py-2 text-sm font-semibold rounded-full transition-all ${
                    !isSignup
                      ? "bg-surface text-primary shadow-sm"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  {auth.buttons.login}
                </button>
              </div>

              {serverError && (
                <div className="p-3 text-xs text-amber-fg bg-amber-bg border border-amber-line/30 rounded-xl">
                  {serverError}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
                {/* Name field (Signup only) */}
                {isSignup && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="auth-name" className="text-xs font-semibold uppercase text-muted">
                      {auth.fields.name.label}
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      autoComplete="name"
                      placeholder={auth.fields.name.placeholder}
                      {...register("name")}
                      className={`w-full px-4 py-3 rounded-xl border bg-bg text-fg text-sm focus:outline-none focus:ring-2 focus:ring-lime ${
                        errors.name ? "border-red-500 bg-red-50/20" : "border-line"
                      }`}
                    />
                    {errors.name && (
                      <span className="text-xs text-red-500 font-medium">
                        {errors.name.message}
                      </span>
                    )}
                  </div>
                )}

                {/* Email field */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="auth-email" className="text-xs font-semibold uppercase text-muted">
                    {auth.fields.email.label}
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    placeholder={auth.fields.email.placeholder}
                    {...register("email")}
                    className={`w-full px-4 py-3 rounded-xl border bg-bg text-fg text-sm focus:outline-none focus:ring-2 focus:ring-lime ${
                      errors.email ? "border-red-500 bg-red-50/20" : "border-line"
                    }`}
                  />
                  {errors.email && (
                    <span className="text-xs text-red-500 font-medium">
                      {errors.email.message}
                    </span>
                  )}
                </div>

                {/* Password field */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="auth-password" className="text-xs font-semibold uppercase text-muted">
                    {auth.fields.password.label}
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={isSignup ? "new-password" : "current-password"}
                      placeholder={
                        isSignup
                          ? auth.fields.password.placeholderSignup
                          : auth.fields.password.placeholderLogin
                      }
                      {...register("password")}
                      className={`w-full px-4 py-3 pr-12 rounded-xl border bg-bg text-fg text-sm focus:outline-none focus:ring-2 focus:ring-lime ${
                        errors.password ? "border-red-500 bg-red-50/20" : "border-line"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? auth.buttons.hidePassword : auth.buttons.showPassword}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-fg text-xs font-medium"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="text-xs text-red-500 font-medium">
                      {errors.password.message}
                    </span>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-lunhaw w-full mt-2"
                >
                  {isSubmitting
                    ? "Processing..."
                    : isSignup
                    ? auth.buttons.signup
                    : auth.buttons.login}
                </button>
              </form>

              {/* Mode switch */}
              <div className="text-center text-sm text-muted pt-2 border-t border-line">
                <span>
                  {isSignup ? auth.switch.hasAccount : auth.switch.noAccount}{" "}
                </span>
                <button
                  type="button"
                  onClick={() => handleModeChange(isSignup ? "login" : "signup")}
                  className="font-semibold text-primary hover:underline"
                >
                  {isSignup ? auth.switch.toLogin : auth.switch.toSignup}
                </button>
              </div>
            </div>
          ) : (
            /* Success State */
            <div className="flex flex-col items-center text-center gap-5 py-4 animate-in zoom-in-95 duration-200">
              <span className="mascot-img w-20 h-20 shadow-md bob" role="img" aria-label={brand.mascotAlt} />
              <div className="flex flex-col gap-1.5">
                <Dialog.Title className="text-2xl font-bold font-display text-primary">
                  {isSignup ? auth.doneSignupTitle : auth.doneLoginTitle}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted">
                  {isSignup ? auth.doneSignupSub : auth.doneLoginSub}
                </Dialog.Description>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="btn-lunhaw w-full mt-2"
              >
                {auth.buttons.done}
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
