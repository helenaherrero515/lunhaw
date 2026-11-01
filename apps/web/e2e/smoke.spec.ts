import { test, expect } from "@playwright/test";

test.describe("Lunhaw Landing Page Smoke Test", () => {
  test("loads landing page, renders key sections and opens auth dialog", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Verify Header & Brand
    await expect(page.locator("header")).toBeVisible();
    await expect(page.getByText("LUNHAW")).toBeVisible();

    // 2. Verify Hero Headline & CTAs
    await expect(
      page.getByRole("heading", { name: /Discover your space/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Explore green spaces near you" }).first()
    ).toBeVisible();

    // 3. Verify Ticker
    await expect(page.getByLabel("What Lunhaw helps you do")).toBeVisible();

    // 4. Verify Features Section
    await expect(page.getByText("Find a place. Reach it.")).toBeVisible();

    // 5. Verify Transparency & Data Integrity Section
    await expect(page.getByText("Honest about what we know.")).toBeVisible();
    await expect(
      page.getByText(/Please verify operating hours directly with the facility/i)
    ).toBeVisible();

    // 6. Verify Auth Dialog interaction
    const createAccountBtn = page.getByRole("button", { name: "Create Account" }).first();
    await createAccountBtn.click();

    // Dialog opens
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();

    // Submit empty form to trigger validation
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Please enter your name.")).toBeVisible();
    await expect(page.getByText("Please enter a valid email.")).toBeVisible();
  });
});
