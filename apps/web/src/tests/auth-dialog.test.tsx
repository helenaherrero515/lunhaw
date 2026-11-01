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
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it("switches to Login tab and hides Name field", async () => {
    render(<AuthDialog />);

    const loginTab = screen.getByRole("tab", { name: "Log in" });
    fireEvent.click(loginTab);

    await waitFor(() => {
      expect(screen.getByText("Welcome back")).toBeInTheDocument();
      expect(screen.queryByLabelText(/Name/i)).not.toBeInTheDocument();
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

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: "Helena" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "helena@lunhaw.ph" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
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
  });
});
