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
  const verifyResponse = await request.post(`${API_BASE_URL.replace(/\/$/, "")}/auth/verify-otp`, {
    data: { mobile: AUTH_MOBILE, otp: AUTH_OTP },
  });

  const payload = await verifyResponse.json().catch(() => null);
  const token =
    payload?.token ||
    payload?.data?.token ||
    payload?.data?.data?.token ||
    payload?.data?.user?.accessToken ||
    payload?.user?.accessToken;

  if (!verifyResponse.ok() || typeof token !== "string" || token.trim().length === 0) {
    throw new Error(`verify-otp failed with status ${verifyResponse.status()}: ${JSON.stringify(payload)}`);
  }

  return token.trim();
}

async function authenticateContext(context: BrowserContext, token: string) {
  await context.addCookies([
    {
      name: "esparex_auth",
      value: token,
      url: FRONTEND_BASE_URL,
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
  return page.locator('button[aria-label="Chat with seller"]:visible').first();
}

function getVisibleRevealButton(page: Page) {
  return page.locator('button[aria-label="Reveal seller phone number"]:visible').first();
}

async function assertRevealOutcome(page: Page, expectation: RevealExpectation) {
  switch (expectation) {
    case "mobile":
      await expect(page.locator('button[aria-label^="Call "]:visible').first()).toBeVisible({ timeout: 15_000 });
      return;
    case "masked":
      await expect(page.locator('button[aria-label^="Call "]:visible').first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText("Login to reveal the full phone number.").first()).toBeVisible({ timeout: 15_000 });
      return;
    case "request_only":
      await expect(page.getByText("Seller shares phone numbers on request only. Use chat first.").first()).toBeVisible({
        timeout: 15_000,
      });
      return;
    case "hidden":
      await expect(page.getByText("Seller chose not to share a phone number for this listing.").first()).toBeVisible({
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

  for (const listingType of ["ad", "service", "spare_part"] as const) {
    test(`${listingType} detail shows chat CTA and starts chat`, async ({ page, context }) => {
      test.skip(Boolean(bootstrapError), bootstrapError || "Smoke bootstrap failed.");
      test.skip(!authToken, `No smoke auth token available. ${bootstrapError || "Set SMOKE_AUTH_TOKEN to run this check."}`);

      const chatFixture = smokeFixtures?.chat[listingType] ?? null;
      test.skip(!chatFixture, getMissingChatFixtureMessage(listingType));

      await authenticateContext(context, authToken);
      await page.goto(buildTargetUrl(chatFixture.path), { waitUntil: "domcontentloaded" });

      await waitForSignedInChrome(page);

      const chatButton = getVisibleChatButton(page);
      await expect(chatButton).toBeVisible({ timeout: 15_000 });

      await chatButton.click();

      await expect
        .poll(
          () => {
            try {
              return new URL(page.url()).pathname;
            } catch {
              return "";
            }
          },
          { timeout: 15_000 }
        )
        .toMatch(/^\/account\/messages\/[^/?#]+$/);

      await expect(page.locator(".conversation-view:visible").first()).toBeVisible({ timeout: 15_000 });
    });
  }

  test("listing detail show number reveals canonical contact data", async ({ page, context }) => {
    test.skip(Boolean(bootstrapError), bootstrapError || "Smoke bootstrap failed.");
    test.skip(!authToken, `No smoke auth token available. ${bootstrapError || "Set SMOKE_AUTH_TOKEN to run this check."}`);

    const revealFixture = smokeFixtures?.reveal ?? null;
    test.skip(!revealFixture, getMissingRevealFixtureMessage());

    await authenticateContext(context, authToken);
    await page.goto(buildTargetUrl(revealFixture.path), { waitUntil: "domcontentloaded" });

    await waitForSignedInChrome(page);

    const revealButton = getVisibleRevealButton(page);
    await expect(revealButton).toBeVisible({ timeout: 15_000 });

    await revealButton.click();

    await assertRevealOutcome(page, revealFixture.expect);
  });
});
