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
    expect(screen.getByRole("link", { name: "Done" })).toHaveAttribute("href", "/home");
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
});
