import {
  test,
  expect,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import {
  getMissingChatFixtureMessage,
  getMissingRevealFixtureMessage,
  resolveListingSmokeFixtures,
  type ListingSmokeFixtures,
  type RevealExpectation,
} from "./fixtures/listingSmokeFixtures";

const FRONTEND_BASE_URL = process.env.SMOKE_FRONTEND_URL || "http://localhost:3000";
const API_BASE_URL = process.env.SMOKE_API_BASE_URL || "http://localhost:5001/api/v1";
const AUTH_MOBILE = (process.env.SMOKE_AUTH_MOBILE || "9030787819").trim();
const AUTH_OTP = (process.env.SMOKE_AUTH_OTP || "123456").trim();
const ENV_AUTH_TOKEN = (process.env.SMOKE_AUTH_TOKEN || "").trim();

async function resolveAuthToken(request: APIRequestContext): Promise<string> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}/auth/verify-otp`;
  const verifyResponse = await request.post(url, {
    data: { mobile: AUTH_MOBILE, otp: AUTH_OTP, name: "Smoke Test User" },
  });

  const payload = await verifyResponse.json().catch(() => null);

  const token =
    payload?.token ||
    payload?.data?.token ||
    payload?.data?.data?.token ||
    payload?.data?.user?.accessToken ||
    payload?.data?.user?.token ||
    payload?.user?.accessToken;

  if (!verifyResponse.ok() || typeof token !== "string" || token.trim().length === 0) {
    throw new Error(`verify-otp failed with status ${verifyResponse.status()}: ${JSON.stringify(payload)}`);
  }

  return token.trim();
}

async function authenticateContext(context: BrowserContext, token: string) {
  // Pre-set location prompt dismissal to avoid flaky overlays blocking clicks
  await context.addInitScript(() => {
    window.localStorage.setItem("esparex_location_prompt_dismissed", "true");
    window.localStorage.setItem("esparex_cookie_consent", "accepted");
    window.localStorage.setItem("esparex_location", JSON.stringify({
      city: "Hyderabad",
      state: "Telangana",
      source: "manual",
      display: "Hyderabad",
      name: "Hyderabad"
    }));
  });

  await context.addCookies([
    {
      name: "esparex_auth",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 60 * 60,
    },
  ]);
}

async function waitForSignedInChrome(page: Page) {
  const signedInChrome = page
    .getByRole("button", { name: /notifications/i })
    .or(page.getByRole("button", { name: /open account menu/i }))
    .or(page.getByRole("link", { name: /^profile$/i }));

  await expect(signedInChrome.first()).toBeVisible({ timeout: 15_000 });
}

function buildTargetUrl(path: string): string {
  return /^https?:\/\//i.test(path) ? path : `${FRONTEND_BASE_URL}${path}`;
}

function getVisibleChatButton(page: Page) {
  return page.locator('button[aria-label="Chat with seller"], button:has-text("Chat")').filter({ visible: true }).first();
}

function getVisibleRevealButton(page: Page) {
  return page.locator('button[aria-label="Reveal seller phone number"], button:has-text("Show number"), button:has-text("Reveal")').filter({ visible: true }).first();
}

async function assertRevealOutcome(page: Page, expectation: string) {
  if (expectation === "mobile" || expectation === "masked") {
    // Both desktop and mobile should show the number in the button/text after reveal
    // The canonical number in smoke fixtures is 9000000001
    const numberLocator = page
      .locator('button:has-text("9000000001"), span:has-text("9000000001")')
      .filter({ visible: true })
      .first();
    await expect(numberLocator).toBeVisible({ timeout: 15_000 });
    return;
  }
  switch (expectation) {
    case "request_only":
      await expect(
        page
          .getByText("Seller shares phone numbers on request only. Use chat first.")
          .filter({ visible: true })
          .first()
      ).toBeVisible({
        timeout: 15_000,
      });
      return;
    case "hidden":
      await expect(
        page
          .getByText("Seller chose not to share a phone number for this listing.")
          .filter({ visible: true })
          .first()
      ).toBeVisible({
        timeout: 15_000,
      });
      return;
  }
}

test.describe("listing contact smoke", () => {
  let authToken = "";
  let smokeFixtures: ListingSmokeFixtures | null = null;
  let bootstrapError: string | null = null;

  test.beforeAll(async ({ playwright }) => {
    try {
      smokeFixtures = resolveListingSmokeFixtures();
      if (ENV_AUTH_TOKEN) {
        authToken = ENV_AUTH_TOKEN;
        return;
      }

      const request = await playwright.request.newContext();
      try {
        authToken = await resolveAuthToken(request);
      } finally {
        await request.dispose();
      }
    } catch (error) {
      bootstrapError = error instanceof Error ? error.message : String(error);
    }
  });

  test.beforeEach(async ({ page }) => {
    // Basic context setup if needed
  });

  for (const listingType of ["ad", "service", "spare_part"] as const) {
    test(`${listingType} detail shows chat CTA and starts chat`, async ({ page, context }) => {
      const chatFixture = smokeFixtures?.chat[listingType] ?? null;
      test.skip(!chatFixture, `No smoke fixture for chat ${listingType}`);

      await authenticateContext(context, authToken);
      await page.goto(buildTargetUrl(chatFixture!.path));

      const chatButton = getVisibleChatButton(page);
      await expect(chatButton).toBeVisible();
      await chatButton.click();

      // Expect navigation to chat or login
      await expect
        .poll(
          () => {
            try {
              const url = new URL(page.url());
              return url.pathname;
            } catch {
              return page.url();
            }
          },
          { timeout: 20_000 }
        )
        .toMatch(/^\/account\/messages\/[^/?#]+$/);
    });
  }

  test("listing detail show number reveals canonical contact data", async ({ page, context }) => {
    test.skip(!smokeFixtures?.reveal, "No smoke fixture for reveal");

    await authenticateContext(context, authToken);
    await page.goto(buildTargetUrl(smokeFixtures!.reveal.path));

    const revealButton = getVisibleRevealButton(page);
    await expect(revealButton).toBeVisible();
    await revealButton.click();

    await assertRevealOutcome(page, smokeFixtures!.reveal.expect);
  });
});
