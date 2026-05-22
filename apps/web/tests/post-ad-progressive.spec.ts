import { expect, test, type Page, type TestInfo } from "@playwright/test";
import {
  envelope,
  fulfillJson,
  installAuthenticatedUserApiMocks,
  seedAuthenticatedUserSession,
  smokeLocation,
  smokeUser,
} from "./fixtures/authenticatedUserSession";

const CATEGORY_ID = "64b000000000000000000001";
const BRAND_ID = "64b000000000000000000002";
const MODEL_ID = "64b000000000000000000003";
const SPARE_PART_ID = "64b000000000000000000004";
const CREATED_LISTING_ID = "64b000000000000000000005";

test.use({ video: "on", trace: "retain-on-failure", screenshot: "only-on-failure" });

const smokeCategory = {
  id: CATEGORY_ID,
  _id: CATEGORY_ID,
  name: "Smartphones",
  slug: "smartphones",
  icon: "smartphone",
  listingType: ["ad", "spare_part"],
  hasScreenSizes: false,
  status: "live",
};

const smokeBrand = {
  id: BRAND_ID,
  _id: BRAND_ID,
  name: "Apple",
  slug: "apple",
  categoryIds: [CATEGORY_ID],
  status: "live",
};

const smokeModel = {
  id: MODEL_ID,
  _id: MODEL_ID,
  name: "iPhone 14",
  brandId: BRAND_ID,
  categoryId: CATEGORY_ID,
  status: "live",
};

const smokeSparePart = {
  id: SPARE_PART_ID,
  _id: SPARE_PART_ID,
  name: "Battery",
  slug: "battery",
  categories: [CATEGORY_ID],
  categoryIds: [CATEGORY_ID],
  status: "live",
};

type RuntimeIssue = {
  type: "console" | "pageerror" | "requestfailed";
  text: string;
  url?: string;
};

function collectRuntimeEvidence(page: Page) {
  const issues: RuntimeIssue[] = [];

  page.on("console", (message) => {
    if (!["warning", "error"].includes(message.type())) return;
    issues.push({
      type: "console",
      text: `[${message.type()}] ${message.text()}`,
      url: message.location().url,
    });
  });

  page.on("pageerror", (error) => {
    issues.push({ type: "pageerror", text: error.message });
  });

  page.on("requestfailed", (request) => {
    issues.push({
      type: "requestfailed",
      text: request.failure()?.errorText || "request failed",
      url: request.url(),
    });
  });

  return issues;
}

function criticalRuntimeIssues(issues: RuntimeIssue[]) {
  return issues.filter((issue) => {
    if (issue.type === "pageerror") return true;
    if (issue.type === "requestfailed" && /\/api(\/|$)/.test(issue.url || "")) {
      return true;
    }
    if (issue.type === "console" && /hydration|uncaught|runtime error/i.test(issue.text)) {
      return true;
    }
    return false;
  });
}

async function attachRuntimeEvidence(testInfo: TestInfo, issues: RuntimeIssue[]) {
  await testInfo.attach("post-ad-runtime-evidence.json", {
    contentType: "application/json",
    body: Buffer.from(JSON.stringify({ issues }, null, 2)),
  });
}

async function withRuntimeEvidence(
  page: Page,
  testInfo: TestInfo,
  run: () => Promise<void>
) {
  const issues = collectRuntimeEvidence(page);
  try {
    await run();
  } finally {
    await attachRuntimeEvidence(testInfo, issues);
  }
  expect(criticalRuntimeIssues(issues)).toEqual([]);
}

async function installPostAdCatalogMocks(page: Page) {
  await page.route(/\/api\/v1\/catalog\/categories\/[^/]+\/schema(\?.*)?$/, (route) =>
    fulfillJson(route, envelope({
      categoryId: CATEGORY_ID,
      categoryName: smokeCategory.name,
      filters: [],
    }))
  );

  await page.route(/\/api\/v1\/catalog\/categories(\?.*)?$/, (route) =>
    fulfillJson(route, envelope([smokeCategory]))
  );

  await page.route(/\/api\/v1\/catalog\/brands(\?.*)?$/, (route) =>
    fulfillJson(route, envelope([smokeBrand]))
  );

  await page.route(/\/api\/v1\/catalog\/models(\?.*)?$/, (route) =>
    fulfillJson(route, envelope([smokeModel]))
  );

  await page.route(/\/api\/v1\/catalog\/spare-parts(\?.*)?$/, (route) =>
    fulfillJson(route, envelope([smokeSparePart]))
  );

  await page.route(/\/api\/v1\/locations\/log-event\/?$/, (route) =>
    fulfillJson(route, { success: true })
  );
}

async function installPostAdMutationMocks(
  page: Page,
  captures: {
    catalogRequests: Record<string, unknown>[];
    listings: Record<string, unknown>[];
  }
) {
  await page.route(/\/api\/v1\/catalog-requests\/?$/, async (route) => {
    const payload = JSON.parse(route.request().postData() || "{}") as Record<string, unknown>;
    captures.catalogRequests.push(payload);
    await fulfillJson(route, envelope({
      id: "64b000000000000000000101",
      requestType: payload.requestType,
      categoryId: payload.categoryId,
      parentBrandId: payload.parentBrandId,
      requestedName: payload.requestedName,
      status: "pending",
      createdAt: "2024-01-01T00:00:00.000Z",
    }));
  });

  await page.route(/\/api\/upload\/ad-image\/?$/, (route) =>
    fulfillJson(route, {
      success: true,
      url: "https://esparex.example.test/uploads/post-ad-smoke.png",
    })
  );

  await page.route(/\/api\/v1\/listings\/?$/, async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    const payload = JSON.parse(route.request().postData() || "{}") as Record<string, unknown>;
    captures.listings.push(payload);

    await fulfillJson(route, envelope({
      _id: CREATED_LISTING_ID,
      id: CREATED_LISTING_ID,
      sellerId: smokeUser.id,
      categoryId: CATEGORY_ID,
      categoryName: smokeCategory.name,
      brandId: BRAND_ID,
      brandName: smokeBrand.name,
      modelId: MODEL_ID,
      modelName: smokeModel.name,
      title: payload.title || "iPhone 14 Pro Max with display issue",
      description: payload.description || "Smoke test listing description with enough detail.",
      price: Number(payload.price || 50000),
      status: "pending",
      listingType: "ad",
      images: ["https://esparex.example.test/uploads/post-ad-smoke.png"],
      location: payload.location || {
        city: smokeLocation.city,
        state: smokeLocation.state,
        display: smokeLocation.display,
        locationId: smokeLocation.locationId,
        coordinates: smokeLocation.coordinates,
      },
      spareParts: [SPARE_PART_ID],
      deviceCondition: "power_on",
      views: 0,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    }));
  });
}

async function installPostAdSmokeMocks(
  page: Page,
  captures = { catalogRequests: [], listings: [] } as {
    catalogRequests: Record<string, unknown>[];
    listings: Record<string, unknown>[];
  }
) {
  await seedAuthenticatedUserSession(page.context());
  await installAuthenticatedUserApiMocks(page);
  await installPostAdCatalogMocks(page);
  await installPostAdMutationMocks(page, captures);
  return captures;
}

async function openPostAd(page: Page) {
  await page.goto("/post-ad", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Post Ad" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Step 1 of 4: Category")).toBeVisible();
  await expect(page.getByRole("button", { name: smokeCategory.name })).toBeVisible();
}

async function selectCategory(page: Page) {
  await page.getByRole("button", { name: smokeCategory.name }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Step 2 of 4: Brand & Model")).toBeVisible();
}

async function selectApprovedBrandAndModel(page: Page) {
  await page.getByPlaceholder(/Search or select brand/i).fill("Apple");
  await page.getByRole("button", { name: "Apple" }).click();
  await expect(page.getByText("Apple").first()).toBeVisible();

  await page.getByPlaceholder(/Search model/i).fill("iPhone");
  await page.getByRole("button", { name: "iPhone 14" }).click();
  await expect(page.getByText("iPhone 14").first()).toBeVisible();
}

async function completeIdentitySteps(page: Page) {
  await selectCategory(page);
  await selectApprovedBrandAndModel(page);

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Step 3 of 4: Details & Condition")).toBeVisible();

  await page.getByRole("button", { name: "Battery" }).click();
  await page.getByRole("button", { name: "Power On" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText("Step 4 of 4: Listing Information")).toBeVisible();
}

async function attachSmokeScreenshot(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({
    path: testInfo.outputPath(`${name}.png`),
    fullPage: true,
  });
}

test.describe("Post Ad authenticated smoke", () => {
  test("opens the guarded Post Ad wizard with an authenticated session", async ({ page }, testInfo) =>
    withRuntimeEvidence(page, testInfo, async () => {
      await installPostAdSmokeMocks(page);
      await openPostAd(page);

      await expect(page.getByLabel("Close")).toBeVisible();
      await attachSmokeScreenshot(page, testInfo, "post-ad-authenticated-step-1");
    }));

  test("loads approved catalog data and submits a listing without runtime failures", async ({ page }, testInfo) =>
    withRuntimeEvidence(page, testInfo, async () => {
      const captures = await installPostAdSmokeMocks(page);
      await openPostAd(page);
      await completeIdentitySteps(page);

      await page.getByPlaceholder(/iPhone 13 Pro/i).fill("iPhone 14 Pro Max with display issue");
      await page
        .getByPlaceholder(/Describe the condition/i)
        .fill("Smoke test listing with a working battery and a display issue. Includes charger and original box.");

      const imageBytes = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
        "base64"
      );
      await page.locator('input[type="file"]').setInputFiles({
        name: "post-ad-smoke.png",
        mimeType: "image/png",
        buffer: imageBytes,
      });
      await expect(page.getByAltText("Listing").first()).toBeVisible({ timeout: 10_000 });

      await expect(page.getByLabel(/Selected location Hyderabad/i)).toBeVisible({ timeout: 10_000 });
      await page.getByPlaceholder("Enter Amount").fill("50000");

      await attachSmokeScreenshot(page, testInfo, "post-ad-authenticated-ready-to-submit");
      await page.getByRole("button", { name: "Confirm & Post Ad" }).click();

      await expect(page.getByText("Ad Submitted Successfully")).toBeVisible({ timeout: 20_000 });
      expect(captures.listings).toHaveLength(1);
      expect(captures.listings[0]).toMatchObject({
        categoryId: CATEGORY_ID,
        brandId: BRAND_ID,
        modelId: MODEL_ID,
        price: 50000,
      });
    }));

  test("allows authenticated users to request a missing brand", async ({ page }, testInfo) =>
    withRuntimeEvidence(page, testInfo, async () => {
      const captures = await installPostAdSmokeMocks(page);
      await openPostAd(page);
      await selectCategory(page);

      await page.getByPlaceholder(/Search or select brand/i).fill("Pear Phone");
      await page.getByLabel("Suggest brand").click();
      await expect(page.getByRole("dialog")).toContainText("Suggest a New Brand");
      await page.getByRole("button", { name: "Submit Request" }).click();

      await expect.poll(() => captures.catalogRequests.length).toBe(1);
      await expect(page.getByText("Pear Phone").first()).toBeVisible();
      expect(captures.catalogRequests[0]).toMatchObject({
        requestType: "brand",
        categoryId: CATEGORY_ID,
        requestedName: "Pear Phone",
      });
    }));

  test("allows authenticated users to request a missing model for an approved brand", async ({ page }, testInfo) =>
    withRuntimeEvidence(page, testInfo, async () => {
      const captures = await installPostAdSmokeMocks(page);
      await openPostAd(page);
      await selectCategory(page);

      await page.getByPlaceholder(/Search or select brand/i).fill("Apple");
      await page.getByRole("button", { name: "Apple" }).click();
      await page.getByPlaceholder(/Search model/i).fill("Prototype 99");
      await page.getByPlaceholder(/Search model/i).press("Enter");
      await expect(page.getByRole("dialog")).toContainText("Suggest a New Model");
      await page.getByRole("button", { name: "Submit Request" }).click();

      await expect.poll(() => captures.catalogRequests.length).toBe(1);
      await expect(page.getByText("Prototype 99").first()).toBeVisible();
      expect(captures.catalogRequests[0]).toMatchObject({
        requestType: "model",
        categoryId: CATEGORY_ID,
        parentBrandId: BRAND_ID,
        requestedName: "Prototype 99",
      });
    }));
});
