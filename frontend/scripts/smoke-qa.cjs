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
const AUTH_TOKEN_PLACEHOLDERS = new Set(["", "__ANON__", "__SET_ME__", "changeme"]);
const AUTH_TOKEN = AUTH_TOKEN_PLACEHOLDERS.has(AUTH_TOKEN_RAW) ? "" : AUTH_TOKEN_RAW;

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
    const url = page.url();
    if (!url.includes("/search")) {
      throw new Error(`search: unexpected final URL ${url}`);
    }
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
    await withAuthCookie(context, FRONTEND_URL, AUTH_TOKEN);
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

    if (AUTH_TOKEN && onLogin) {
      throw new Error("post-ad: authenticated smoke token redirected to login.");
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
  if (!AUTH_TOKEN) {
    console.warn(
      "WARN: SMOKE_AUTH_TOKEN is not set. Authenticated post-ad assertions were relaxed to route-level checks."
    );
  }

  if (failed.length > 0) {
    process.exit(1);
  }
})();
