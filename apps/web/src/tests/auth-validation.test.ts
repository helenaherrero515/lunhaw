import { describe, it, expect } from "vitest";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(1, { message: "Please enter your name." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Use at least 8 characters." }),
});

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Please enter your password." }),
});

describe("Auth Zod Schema Validation", () => {
  it("validates successful signup input", () => {
    const valid = signupSchema.safeParse({
      name: "Helena",
      email: "helena@lunhaw.ph",
      password: "securepassword123",
    });
    expect(valid.success).toBe(true);
  });

  it("fails signup when name is empty", () => {
    const invalid = signupSchema.safeParse({
      name: "",
      email: "helena@lunhaw.ph",
      password: "securepassword123",
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues[0]?.message).toBe("Please enter your name.");
    }
  });

  it("fails signup when email is invalid", () => {
    const invalid = signupSchema.safeParse({
      name: "Helena",
      email: "not-an-email",
      password: "securepassword123",
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues[0]?.message).toBe("Please enter a valid email.");
    }
  });

  it("fails signup when password is less than 8 characters", () => {
    const invalid = signupSchema.safeParse({
      name: "Helena",
      email: "helena@lunhaw.ph",
      password: "short",
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues[0]?.message).toBe("Use at least 8 characters.");
    }
  });

  it("validates successful login input", () => {
    const valid = loginSchema.safeParse({
      email: "user@example.com",
      password: "mypassword",
    });
    expect(valid.success).toBe(true);
  });
});
