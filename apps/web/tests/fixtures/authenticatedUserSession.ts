import type { BrowserContext, Page, Route } from "@playwright/test";

export const SMOKE_FRONTEND_BASE_URL =
  process.env.SMOKE_FRONTEND_URL || "http://localhost:3000";

export const SMOKE_API_BASE_URL =
  process.env.SMOKE_API_BASE_URL || "http://localhost:5001/api/v1";

export const smokeUser = {
  id: "64b0000000000000000000aa",
  mobile: "9030787819",
  role: "user",
  name: "Smoke Test User",
  email: "smoke@example.com",
  isPhoneVerified: true,
  businessStatus: "pending",
  createdAt: "2024-01-01T00:00:00.000Z",
  locationId: "64b0000000000000000000bb",
  location: {
    id: "64b0000000000000000000bb",
    locationId: "64b0000000000000000000bb",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    display: "Hyderabad, Telangana",
    name: "Hyderabad",
    coordinates: {
      type: "Point",
      coordinates: [78.4867, 17.385],
    },
  },
};

export const smokeLocation = {
  formattedAddress: "Hyderabad, Telangana",
  city: "Hyderabad",
  state: "Telangana",
  country: "India",
  source: "manual",
  id: "64b0000000000000000000bb",
  locationId: "64b0000000000000000000bb",
  name: "Hyderabad",
  display: "Hyderabad, Telangana",
  coordinates: {
    type: "Point",
    coordinates: [78.4867, 17.385],
  },
};

export const envelope = <T>(data: T) => ({ success: true, data });

export async function fulfillJson(route: Route, payload: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(payload),
  });
}

export async function seedAuthenticatedUserSession(
  context: BrowserContext,
  token = "fake-smoke-token"
) {
  const expires = Math.floor(Date.now() / 1000) + 60 * 60;

  await context.addInitScript((location) => {
    window.localStorage.setItem("esparex_user_session", "1");
    window.localStorage.setItem("esparex_cookie_consent", "accepted");
    window.localStorage.setItem("esparex_location_prompt_dismissed", "true");
    window.localStorage.setItem(
      "esparex_location",
      JSON.stringify({ ...location, detectedAt: Date.now() })
    );
  }, smokeLocation);

  await context.addCookies([
    {
      name: "esparex_auth",
      value: token,
      url: SMOKE_FRONTEND_BASE_URL,
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      expires,
    },
    {
      name: "esparex_auth",
      value: token,
      url: "http://127.0.0.1:3000",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      expires,
    },
  ]);
}

export async function installAuthenticatedUserApiMocks(page: Page) {
  await page.route(/\/api\/v1\/health\/?$/, (route) =>
    fulfillJson(route, { success: true, status: "ok", mode: "smoke" })
  );

  await page.route(/\/api\/v1\/csrf-token\/?$/, (route) =>
    fulfillJson(route, { csrfToken: "mock-csrf-token-for-smoke" })
  );

  await page.route(/\/api\/v1\/auth\/csrf\/?$/, (route) =>
    fulfillJson(route, { csrfToken: "mock-csrf-token-for-smoke" })
  );

  await page.route(/\/api\/v1\/users\/me\/?$/, (route) =>
    fulfillJson(route, envelope(smokeUser))
  );

  await page.route(/\/api\/v1\/users\/me\/posting-balance\/?$/, (route) =>
    fulfillJson(
      route,
      envelope({ totalRemaining: 3, freeRemaining: 1, paidCredits: 2 })
    )
  );

  await page.route(/\/api\/v1\/users\/saved-ads(\?.*)?$/, (route) =>
    fulfillJson(route, envelope([]))
  );

  await page.route(/\/api\/v1\/auth\/logout\/?$/, (route) =>
    fulfillJson(route, { success: true })
  );
}
