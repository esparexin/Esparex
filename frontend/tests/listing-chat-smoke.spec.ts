import { test, expect, type APIRequestContext, type BrowserContext } from "@playwright/test";

const FRONTEND_BASE_URL = process.env.SMOKE_FRONTEND_URL || "http://127.0.0.1:3000";
const API_BASE_URL = process.env.SMOKE_API_BASE_URL || "http://127.0.0.1:5001/api/v1";
const AUTH_MOBILE = (process.env.SMOKE_AUTH_MOBILE || "9030787819").trim();
const AUTH_OTP = (process.env.SMOKE_AUTH_OTP || "123456").trim();
const ENV_AUTH_TOKEN = (process.env.SMOKE_AUTH_TOKEN || "").trim();
const ENV_AD_PATH = (process.env.SMOKE_CHAT_AD_PATH || "").trim();
const ENV_SERVICE_PATH = (process.env.SMOKE_CHAT_SERVICE_PATH || "").trim();
const ENV_SPARE_PART_PATH = (process.env.SMOKE_CHAT_SPARE_PART_PATH || "").trim();

type ListingType = "ad" | "service" | "spare_part";

type ListingCandidate = {
  id: string;
  sellerId: string;
  title?: string;
  seoSlug?: string;
};

const LISTING_TYPE_CONFIG: Record<
  ListingType,
  {
    endpoint: string;
    basePath: string;
  }
> = {
  ad: {
    endpoint: "ads?limit=10&page=1&status=live",
    basePath: "/ads",
  },
  service: {
    endpoint: "services?limit=10&page=1&status=live",
    basePath: "/services",
  },
  spare_part: {
    endpoint: "spare-part-listings?limit=10&page=1&status=live",
    basePath: "/spare-part-listings",
  },
};

function extractItems(payload: unknown): Record<string, unknown>[] {
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  const data = record.data;

  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object") {
    const dataRecord = data as Record<string, unknown>;
    if (Array.isArray(dataRecord.items)) return dataRecord.items as Record<string, unknown>[];
  }
  if (Array.isArray(record.items)) return record.items as Record<string, unknown>[];
  return [];
}

function toCandidate(item: Record<string, unknown>): ListingCandidate | null {
  const id = String(item.id || item._id || "").trim();
  const sellerId = String(item.sellerId || "").trim();

  if (!id || !sellerId) return null;

  return {
    id,
    sellerId,
    title: typeof item.title === "string" ? item.title : undefined,
    seoSlug:
      typeof item.seoSlug === "string"
        ? item.seoSlug
        : typeof item.slug === "string"
          ? item.slug
          : undefined,
  };
}

function slugifyTitle(title?: string): string {
  return String(title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildListingPath(type: ListingType, listing: ListingCandidate): string {
  const basePath = LISTING_TYPE_CONFIG[type].basePath;
  const slug = (listing.seoSlug || "").trim() || slugifyTitle(listing.title);
  return slug ? `${basePath}/${encodeURIComponent(slug)}-${encodeURIComponent(listing.id)}` : `${basePath}/${encodeURIComponent(listing.id)}`;
}

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

async function getAuthedUserId(request: APIRequestContext, token: string): Promise<string> {
  const response = await request.get(`${API_BASE_URL.replace(/\/$/, "")}/users/me`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json().catch(() => null);
  const user = payload?.data || payload?.user || payload;
  const userId = String(user?.id || user?._id || "").trim();

  if (!response.ok() || !userId) {
    throw new Error(`users/me failed with status ${response.status()}: ${JSON.stringify(payload)}`);
  }

  return userId;
}

async function resolvePublicListingPath(
  request: APIRequestContext,
  type: ListingType,
  viewerUserId: string
): Promise<string | null> {
  const endpoint = LISTING_TYPE_CONFIG[type].endpoint;
  const response = await request.get(`${API_BASE_URL.replace(/\/$/, "")}/${endpoint}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok()) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  const listing = extractItems(payload)
    .map(toCandidate)
    .find((candidate): candidate is ListingCandidate => Boolean(candidate && candidate.sellerId !== viewerUserId));

  return listing ? buildListingPath(type, listing) : null;
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

test.describe("listing chat smoke", () => {
  let authToken = "";
  let authedUserId = "";
  const listingPaths: Partial<Record<ListingType, string | null>> = {};
  let bootstrapError: string | null = null;

  test.beforeAll(async ({ playwright }) => {
    if (ENV_AUTH_TOKEN) {
      authToken = ENV_AUTH_TOKEN;
      listingPaths.ad = ENV_AD_PATH || null;
      listingPaths.service = ENV_SERVICE_PATH || null;
      listingPaths.spare_part = ENV_SPARE_PART_PATH || null;
      return;
    }

    const request = await playwright.request.newContext();

    try {
      authToken = await resolveAuthToken(request);
      authedUserId = await getAuthedUserId(request, authToken);
      listingPaths.ad = await resolvePublicListingPath(request, "ad", authedUserId);
      listingPaths.service = await resolvePublicListingPath(request, "service", authedUserId);
      listingPaths.spare_part = await resolvePublicListingPath(request, "spare_part", authedUserId);
    } catch (error) {
      bootstrapError = error instanceof Error ? error.message : String(error);
    } finally {
      await request.dispose();
    }
  });

  for (const listingType of ["ad", "service", "spare_part"] as const) {
    test(`${listingType} detail shows chat CTA and starts chat`, async ({ page, context }) => {
      test.skip(!authToken, `No smoke auth token available. ${bootstrapError || "Set SMOKE_AUTH_TOKEN to run this check."}`);
      test.skip(!listingPaths[listingType], `No public non-owned ${listingType} listing available in local data.`);

      await authenticateContext(context, authToken);
      await page.goto(`${FRONTEND_BASE_URL}${listingPaths[listingType]}`, { waitUntil: "domcontentloaded" });

      const chatButton = page.getByRole("button", { name: /chat with seller/i }).first();
      await expect(chatButton).toBeVisible({ timeout: 15_000 });

      await chatButton.click();

      await expect
        .poll(() => {
          try {
            return new URL(page.url()).pathname;
          } catch {
            return "";
          }
        }, { timeout: 15_000 })
        .toMatch(/^\/chat\/[^/?#]+$/);

      await expect(page.locator(".conversation-view")).toBeVisible({ timeout: 15_000 });
    });
  }
});
