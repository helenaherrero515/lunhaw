import { test, expect } from "@playwright/test";

test.describe("Lunhaw Landing Page Smoke Test", () => {
  test("loads landing page, renders key sections, CTA and opens auth dialog", async ({
    page,
  }) => {
    await page.goto("/");

    // 0. Verify Page Title is "Lunhaw"
    await expect(page).toHaveTitle("Lunhaw");

    // 1. Verify Header & Brand
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("header").getByText("LUNHAW")).toBeVisible();

    // 2. Verify Hero Headline & CTAs
    await expect(
      page.getByRole("heading", { name: /Discover your space/i }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Explore green spaces near you" }).first()
    ).toBeVisible();

    // 3. Verify Ticker
    await expect(page.getByLabel("What Lunhaw helps you do")).toBeVisible();

    // 4. Verify Features Section
    await expect(page.getByText("Find a place. Reach it.")).toBeVisible();

    // 5. Verify FAQ Section (Good to know.)
    await expect(page.getByText("Good to know.")).toBeVisible();
    await expect(page.getByText("What is Lunhaw?")).toBeVisible();

    // 6. Verify Auth Dialog interaction
    const createAccountBtn = page.getByRole("button", { name: "Create Account" }).first();
    await createAccountBtn.click();

    // Dialog opens
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();

    // Submit empty form to trigger validation
    await dialog.getByRole("button", { name: "Create account" }).click();
    await expect(dialog.getByText("Please enter your name.")).toBeVisible();
    await expect(dialog.getByText("Please enter a valid email.")).toBeVisible();

    // Close dialog
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).not.toBeVisible();

    // 7. Verify CTA band (statement, links, mascot) and the footer revealed beneath it
    const cta = page.locator("#start");
    await expect(
      cta.getByRole("heading", { name: "Discover your space. Explore your city. Go greener." })
    ).toBeVisible();
    await expect(cta.getByRole("link", { name: "Explore green spaces near you" })).toHaveAttribute("href", "#top");
    await expect(cta.getByRole("link", { name: "Enter your area manually" })).toBeVisible();
    await expect(page.locator("#cta-mascot")).toBeVisible();
    await expect(page.locator(".rv footer")).toBeAttached();
  });
});
