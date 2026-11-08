import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthDialog } from "@/components/AuthDialog";
import { useLunhawStore } from "@/lib/store/use-lunhaw-store";

describe("AuthDialog Component", () => {
  beforeEach(() => {
    useLunhawStore.setState({ isAuthOpen: true, authMode: "signup" });
  });

  it("renders Signup view initially with all input fields", () => {
    render(<AuthDialog />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Create your account")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("switches to Login tab and hides Name field", async () => {
    render(<AuthDialog />);

    const loginTab = screen.getByRole("tab", { name: "Log in" });
    fireEvent.click(loginTab);

    await waitFor(() => {
      expect(screen.getByText("Welcome back")).toBeInTheDocument();
      expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    });
  });

  it("triggers validation errors when submitting empty signup form", async () => {
    render(<AuthDialog />);

    const submitBtn = screen.getByRole("button", { name: "Create account" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Please enter your name.")).toBeInTheDocument();
      expect(screen.getByText("Please enter a valid email.")).toBeInTheDocument();
      expect(screen.getByText("Use at least 8 characters.")).toBeInTheDocument();
    });
  });

  it("submits valid form and transitions to success view", async () => {
    render(<AuthDialog />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Helena" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "helena@lunhaw.ph" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });

    const submitBtn = screen.getByRole("button", { name: "Create account" });
    fireEvent.click(submitBtn);

    await waitFor(
      () => {
        expect(screen.getByText("Welcome to Lunhaw!")).toBeInTheDocument();
        expect(screen.getByText("Your green space is waiting.")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
    expect(screen.getByRole("link", { name: "Open my account" })).toHaveAttribute("href", "/home");

    fireEvent.click(screen.getByRole("button", { name: "Stay on this page" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("uses login copy and asks for the password when it is missing", async () => {
    render(<AuthDialog />);
    fireEvent.click(screen.getByRole("tab", { name: "Log in" }));

    expect(screen.getByText("Log in to continue.")).toBeInTheDocument();
    expect(screen.getByText("New to Lunhaw?")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "helena@lunhaw.ph" } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(screen.getByText("Please enter your password.")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Password")).toHaveFocus();
  });

  it("closes on Escape and unlocks page scroll", async () => {
    render(<AuthDialog />);
    await waitFor(() => expect(document.documentElement.style.overflow).toBe("hidden"));

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("switches to password recovery mode when Forgot password is clicked and submits recovery email", async () => {
    render(<AuthDialog />);
    fireEvent.click(screen.getByRole("tab", { name: "Log in" }));

    const forgotBtn = screen.getByRole("button", { name: "Forgot password?" });
    expect(forgotBtn).toBeInTheDocument();
    fireEvent.click(forgotBtn);

    expect(screen.getByText("Reset your password")).toBeInTheDocument();
    expect(screen.getByText("Enter your email to receive a reset link.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@lunhaw.ph" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(screen.getByText("Check your email")).toBeInTheDocument();
      expect(screen.getByText(/We sent a password reset link to/)).toBeInTheDocument();
    });
  });

  it("submits password update when opened in update_password mode", async () => {
    useLunhawStore.setState({ isAuthOpen: true, authMode: "update_password" });
    render(<AuthDialog />);

    expect(screen.getByText("Choose a new password")).toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "newsecurepassword123" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => {
      expect(screen.getByText("Password updated!")).toBeInTheDocument();
    });
  });
});
