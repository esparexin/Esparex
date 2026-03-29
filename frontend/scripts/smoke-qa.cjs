const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const { chromium } = require("@playwright/test");

const frontendRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(frontendRoot, "..");

const envCandidates = [
  path.join(frontendRoot, ".env.test"),
  path.join(repoRoot, ".env.test"),
  path.join(frontendRoot, ".env.local"),
  path.join(repoRoot, ".env"),
];

for (const envFile of envCandidates) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile, override: false });
  }
}

const FRONTEND_URL = process.env.SMOKE_FRONTEND_URL || "http://localhost:3000";
const ADMIN_FRONTEND_URL =
  process.env.SMOKE_ADMIN_FRONTEND_URL || process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001";
const API_BASE_URL = process.env.SMOKE_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
const AUTH_TOKEN_RAW = (process.env.SMOKE_AUTH_TOKEN || "").trim();
const AUTH_MOBILE = (process.env.SMOKE_AUTH_MOBILE || "9030787819").trim();
const AUTH_OTP = (process.env.SMOKE_AUTH_OTP || "123456").trim();
const AUTH_TOKEN_PLACEHOLDERS = new Set(["", "__ANON__", "__SET_ME__", "changeme"]);
let AUTH_TOKEN = AUTH_TOKEN_PLACEHOLDERS.has(AUTH_TOKEN_RAW) ? "" : AUTH_TOKEN_RAW;

const results = [];

const summarize = () => {
  const failed = results.filter((result) => !result.ok);
  console.log("\n--- Smoke QA Summary ---");
  for (const result of results) {
    console.log(`${result.ok ? "PASS" : "FAIL"}: ${result.name}`);
  }
  return failed;
};

const run = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`PASS: ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, ok: false, error: message });
    console.error(`FAIL: ${name}`);
    console.error(message);
  }
};

const assertHealthyResponse = (response, routeName) => {
  if (!response) {
    throw new Error(`${routeName}: no HTTP response captured.`);
  }

  const status = response.status();
  if (status >= 500) {
    throw new Error(`${routeName}: server error status ${status}.`);
  }
};

const assertUrlIncludes = (actualUrl, expectedFragment, routeName) => {
  if (!actualUrl.includes(expectedFragment)) {
    throw new Error(`${routeName}: expected final URL to include ${expectedFragment}, got ${actualUrl}`);
  }
};

const extractApiItems = (payload) => {
  const data = payload?.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.output?.items)) return payload.output.items;
  if (Array.isArray(payload?.output)) return payload.output;
  return [];
};

const extractApiToken = (payload) =>
  payload?.token ||
  payload?.data?.token ||
  payload?.data?.data?.token ||
  payload?.data?.user?.accessToken ||
  payload?.user?.accessToken ||
  "";

const extractListingId = (item) => {
  const id = item?.id || item?._id;
  return typeof id === "string" && id.trim() ? id.trim() : "";
};

const withAuthCookie = async (context, url, token) => {
  if (!token) return;

  await context.addCookies([
    {
      name: "esparex_auth",
      value: token,
      url,
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
};

const resolveAuthToken = async (browser) => {
  if (AUTH_TOKEN) return AUTH_TOKEN;

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const sendResponse = await page.request.post(`${API_BASE_URL.replace(/\/$/, "")}/auth/send-otp`, {
      data: { mobile: AUTH_MOBILE },
    });

    if (!sendResponse.ok()) {
      throw new Error(`send-otp failed with status ${sendResponse.status()}`);
    }

    const verifyResponse = await page.request.post(`${API_BASE_URL.replace(/\/$/, "")}/auth/verify-otp`, {
      data: { mobile: AUTH_MOBILE, otp: AUTH_OTP },
    });
    const payload = await verifyResponse.json().catch(() => null);
    const token = extractApiToken(payload);

    if (!verifyResponse.ok() || !token) {
      throw new Error(
        `verify-otp failed with status ${verifyResponse.status()}: ${JSON.stringify(payload)}`
      );
    }

    AUTH_TOKEN = token;
    console.log("INFO: Acquired authenticated smoke token via OTP bootstrap.");
    return AUTH_TOKEN;
  } finally {
    await context.close();
  }
};

const fetchOwnedListing = async (page, token, listingType) => {
  const query = new URLSearchParams({
    type: listingType,
    status: "live",
    page: "1",
    limit: "1",
  });

  const response = await page.request.get(`${API_BASE_URL.replace(/\/$/, "")}/listings/mine?${query.toString()}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok()) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  const item = extractApiItems(payload)[0];
  if (!item) {
    return null;
  }

  const id = extractListingId(item);
  return id ? { id, listingType } : null;
};

const fetchPromotableListing = async (page, token) => {
  for (const listingType of ["ad", "service"]) {
    const item = await fetchOwnedListing(page, token, listingType);
    if (item) {
      return item;
    }
  }
  return null;
};

const fetchFirstAdSlug = async () => {
  try {
    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/ads?limit=1&page=1`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return null;
    const payload = await response.json().catch(() => null);
    const data = payload?.data;
    const list = Array.isArray(data)
      ? data
      : Array.isArray(payload?.output?.items)
        ? payload.output.items
        : Array.isArray(payload?.output)
          ? payload.output
          : [];

    const item = list[0];
    if (!item) return null;

    const id = String(item.id || item._id || "").trim();
    const slug = String(item.seoSlug || item.slug || "").trim();
    if (!id) return null;
    return slug ? `${slug}-${id}` : id;
  } catch {
    return null;
  }
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  let authenticatedToken = "";

  try {
    authenticatedToken = await resolveAuthToken(browser);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`WARN: Unable to bootstrap authenticated smoke token. ${message}`);
  }

  await run("homepage route smoke", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const response = await page.goto(`${FRONTEND_URL}/`, { waitUntil: "domcontentloaded" });
    assertHealthyResponse(response, "homepage");
    await page.waitForTimeout(700);
    const bodyText = (await page.locator("body").innerText()).trim();
    if (!bodyText) {
      throw new Error("homepage: body content is empty.");
    }
    await context.close();
  });

  await run("search route smoke", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const response = await page.goto(`${FRONTEND_URL}/search`, { waitUntil: "domcontentloaded" });
    assertHealthyResponse(response, "search");
    await page.waitForTimeout(700);
    assertUrlIncludes(page.url(), "/search?type=ad", "search");
    await context.close();
  });

  await run("browse services canonical redirect smoke", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const response = await page.goto(`${FRONTEND_URL}/browse-services?q=repair`, {
      waitUntil: "domcontentloaded",
    });
    assertHealthyResponse(response, "browse-services");
    await page.waitForTimeout(900);
    assertUrlIncludes(page.url(), "/search?type=service", "browse-services");
    await context.close();
  });

  await run("browse spare parts canonical redirect smoke", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const response = await page.goto(`${FRONTEND_URL}/browse-spare-parts?q=iphone`, {
      waitUntil: "domcontentloaded",
    });
    assertHealthyResponse(response, "browse-spare-parts");
    await page.waitForTimeout(900);
    assertUrlIncludes(page.url(), "/search?type=spare_part", "browse-spare-parts");
    await context.close();
  });

  await run("ad detail route smoke", async () => {
    const adSlug = await fetchFirstAdSlug();
    if (!adSlug) {
      throw new Error("ad detail: could not resolve an ad slug/id from API.");
    }

    const context = await browser.newContext();
    const page = await context.newPage();
    const response = await page.goto(`${FRONTEND_URL}/ads/${adSlug}`, { waitUntil: "domcontentloaded" });
    assertHealthyResponse(response, "ad detail");
    await page.waitForTimeout(700);
    const url = page.url();
    if (!url.includes("/ads/")) {
      throw new Error(`ad detail: unexpected final URL ${url}`);
    }
    await context.close();
  });

  await run("post ad flow smoke", async () => {
    const context = await browser.newContext();
    await withAuthCookie(context, FRONTEND_URL, authenticatedToken);
    const page = await context.newPage();
    const response = await page.goto(`${FRONTEND_URL}/post-ad`, { waitUntil: "domcontentloaded" });
    assertHealthyResponse(response, "post-ad");
    await page.waitForTimeout(900);

    const url = page.url();
    const onPostAd = url.includes("/post-ad");
    const onLogin = url.includes("/login");

    if (!onPostAd && !onLogin) {
      throw new Error(`post-ad: unexpected final URL ${url}`);
    }

    if (authenticatedToken && onLogin) {
      throw new Error("post-ad: authenticated smoke token redirected to login.");
    }

    await context.close();
  });

  await run("account login callback smoke", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const response = await page.goto(`${FRONTEND_URL}/account/ads?status=pending`, {
      waitUntil: "domcontentloaded",
    });
    assertHealthyResponse(response, "account redirect");
    await page.waitForTimeout(700);
    assertUrlIncludes(
      page.url(),
      "/login?callbackUrl=%2Faccount%2Fads%3Fstatus%3Dpending",
      "account redirect"
    );
    await context.close();
  });

  await run("chat login callback smoke", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const response = await page.goto(`${FRONTEND_URL}/chat`, { waitUntil: "domcontentloaded" });
    assertHealthyResponse(response, "chat redirect");
    await page.waitForTimeout(700);
    assertUrlIncludes(
      page.url(),
      "/login?callbackUrl=%2Faccount%2Fmessages",
      "chat redirect"
    );
    await context.close();
  });

  await run("authenticated callback resume smoke", async () => {
    if (!authenticatedToken) {
      throw new Error("Authenticated smoke token unavailable.");
    }

    const context = await browser.newContext();
    const page = await context.newPage();
    const response = await page.goto(`${FRONTEND_URL}/account/ads?status=pending`, {
      waitUntil: "domcontentloaded",
    });
    assertHealthyResponse(response, "authenticated callback");
    await page.waitForTimeout(700);
    assertUrlIncludes(
      page.url(),
      "/login?callbackUrl=%2Faccount%2Fads%3Fstatus%3Dpending",
      "authenticated callback"
    );

    await withAuthCookie(context, FRONTEND_URL, authenticatedToken);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    assertUrlIncludes(page.url(), "/account/ads?status=pending", "authenticated callback");
    await context.close();
  });

  await run("legacy ad submission success route smoke", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const response = await page.goto(`${FRONTEND_URL}/ad-submission-success`, {
      waitUntil: "domcontentloaded",
    });
    if (!response) {
      throw new Error("ad submission success legacy route: no HTTP response captured.");
    }
    if (response.status() !== 404) {
      throw new Error(
        `ad submission success legacy route: expected 404 for removed page, got ${response.status()}.`
      );
    }
    await context.close();
  });

  await run("promote route smoke", async () => {
    if (!authenticatedToken) {
      throw new Error("Authenticated smoke token unavailable.");
    }

    const context = await browser.newContext();
    await withAuthCookie(context, FRONTEND_URL, authenticatedToken);
    const page = await context.newPage();
    const listing = await fetchPromotableListing(page, authenticatedToken);
    if (!listing) {
      throw new Error("No live ad/service listing available for promotion smoke.");
    }

    const response = await page.request.post(
      `${API_BASE_URL.replace(/\/$/, "")}/listings/${encodeURIComponent(listing.id)}/promote`,
      {
        data: { days: 7, type: "spotlight_hp" },
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${authenticatedToken}`,
        },
      }
    );
    const payload = await response.json().catch(() => null);
    if (!response.ok()) {
      throw new Error(`promote route failed with status ${response.status()}: ${JSON.stringify(payload)}`);
    }

    if (String(payload?.data?.listingId || "") !== listing.id) {
      throw new Error(`promote route returned unexpected listing payload: ${JSON.stringify(payload)}`);
    }

    await context.close();
  });

  await run("listing phone reveal smoke", async () => {
    if (!authenticatedToken) {
      throw new Error("Authenticated smoke token unavailable.");
    }

    const context = await browser.newContext();
    await withAuthCookie(context, FRONTEND_URL, authenticatedToken);
    const page = await context.newPage();
    const listing = await fetchPromotableListing(page, authenticatedToken);
    if (!listing) {
      throw new Error("No live ad/service listing available for phone reveal smoke.");
    }

    const response = await page.request.get(
      `${API_BASE_URL.replace(/\/$/, "")}/listings/${encodeURIComponent(listing.id)}/phone`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${authenticatedToken}`,
        },
      }
    );
    const payload = await response.json().catch(() => null);
    const mobile = payload?.data?.mobile || payload?.data?.phone || payload?.mobile || payload?.phone;

    if (!response.ok() || typeof mobile !== "string" || mobile.trim().length === 0) {
      throw new Error(`listing phone reveal failed with status ${response.status()}: ${JSON.stringify(payload)}`);
    }

    await context.close();
  });

  await run("legacy route redirects smoke", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${FRONTEND_URL}/my-services`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    assertUrlIncludes(
      page.url(),
      "/login?callbackUrl=%2Faccount%2Fservices%3Fstatus%3Dlive",
      "my-services redirect"
    );

    await page.goto(`${FRONTEND_URL}/purchases`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    assertUrlIncludes(
      page.url(),
      "/login?callbackUrl=%2Faccount%2Fpurchases",
      "purchases redirect"
    );

    await page.goto(`${FRONTEND_URL}/business`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    const businessUrl = page.url();
    if (businessUrl !== `${FRONTEND_URL}/` && businessUrl !== `${FRONTEND_URL}`) {
      throw new Error(`business redirect: expected homepage, got ${businessUrl}`);
    }

    await context.close();
  });

  await run("admin moderation route smoke", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const response = await page.goto(`${ADMIN_FRONTEND_URL.replace(/\/$/, "")}/moderation`, {
      waitUntil: "domcontentloaded",
    });
    assertHealthyResponse(response, "admin moderation");
    await page.waitForTimeout(700);

    const finalUrl = page.url();
    const validRoute =
      finalUrl.includes("/moderation") ||
      finalUrl.includes("/login") ||
      finalUrl.includes("/dashboard");

    if (!validRoute) {
      throw new Error(`admin moderation: unexpected final URL ${finalUrl}`);
    }
    await context.close();
  });

  await browser.close();

  const failed = summarize();

  if (failed.length > 0) {
    process.exit(1);
  }
})();
