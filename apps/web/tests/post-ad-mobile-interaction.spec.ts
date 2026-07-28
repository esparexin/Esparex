import { expect, test } from "@playwright/test";
import {
  envelope,
  fulfillJson,
  installAuthenticatedUserApiMocks,
  seedAuthenticatedUserSession,
} from "./fixtures/authenticatedUserSession";

const CATEGORY_ID = "64b000000000000000000001";
const BRAND_ID = "64b000000000000000000002";
const MODEL_ID = "64b000000000000000000003";
const SPARE_PART_ID = "64b000000000000000000004";

const smokeCategory = {
  id: CATEGORY_ID,
  _id: CATEGORY_ID,
  name: "Mobiles",
  slug: "mobiles",
  icon: "smartphone",
  listingType: ["ad"],
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
  name: "iPhone 14 Pro",
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

async function installPostAdCatalogMocks(page: import("@playwright/test").Page) {
  await seedAuthenticatedUserSession(page.context());
  await installAuthenticatedUserApiMocks(page);

  await page.route("**/**/api/v1/posting-balances**", (route) =>
    fulfillJson(route, envelope({ hasQuota: true, remaining: 10, unlimited: true }))
  );
  await page.route("**/**/api/v1/catalog/categories/*/schema**", (route) =>
    fulfillJson(route, envelope({ categoryId: CATEGORY_ID, categoryName: smokeCategory.name, filters: [] }))
  );
  await page.route("**/**/api/v1/catalog/categories**", (route) =>
    fulfillJson(route, envelope([smokeCategory]))
  );
  await page.route("**/**/api/v1/catalog/brands**", (route) =>
    fulfillJson(route, envelope([smokeBrand]))
  );
  await page.route("**/**/api/v1/catalog/models**", (route) =>
    fulfillJson(route, envelope([smokeModel]))
  );
  await page.route("**/**/api/v1/catalog/spare-parts**", (route) =>
    fulfillJson(route, envelope([smokeSparePart]))
  );
  await page.route("**/**/api/v1/locations/log-event**", (route) =>
    fulfillJson(route, { success: true })
  );
}

const VIEWPORTS = [
  { name: "320px (XS Mobile)", width: 320, height: 640, isMobile: true },
  { name: "375px (iPhone SE)", width: 375, height: 667, isMobile: true },
  { name: "390px (iPhone 14)", width: 390, height: 844, isMobile: true },
  { name: "430px (iPhone Pro Max)", width: 430, height: 932, isMobile: true },
  { name: "1024px (Desktop Modal)", width: 1024, height: 768, isMobile: false },
];

test.describe("Post Ad Responsive & Hit-Testing Interaction Matrix", () => {
  for (const vp of VIEWPORTS) {
    test(`completes full interaction flow on ${vp.name} without force clicks`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await installPostAdCatalogMocks(page);

      console.log(`[E2E] Testing viewport: ${vp.name} (${vp.width}x${vp.height})`);
      await page.goto("/post-ad", { waitUntil: "domcontentloaded" });

      const heading = page.getByRole("heading", { name: "Post Ad" });
      await expect(heading).toBeVisible({ timeout: 20_000 });

      // Verify bounds alignment on mobile (modal dialog left edge is >= 0 and right edge <= viewport width)
      const dialogContent = page.getByRole("dialog").first();
      await expect(dialogContent).toBeVisible();
      const box = await dialogContent.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        if (vp.isMobile) {
          // On mobile bottom sheet, x should be 0 and width should equal screen width
          expect(box.x).toBe(0);
          expect(Math.round(box.width)).toBe(vp.width);
        } else {
          // On desktop centered modal, x should be centered
          expect(box.x).toBeGreaterThan(0);
        }
      }

      // Step 1: Select Category (standard unforced click)
      const categoryBtn = page.getByRole("button", { name: /Mobiles/i });
      await expect(categoryBtn).toBeVisible({ timeout: 10_000 });
      await categoryBtn.click(); // Unforced click

      // Step 2: Select Brand
      const brandInput = page.getByTestId("step-one-fields").getByPlaceholder(/Search or select brand/i);
      await expect(brandInput).toBeVisible({ timeout: 10_000 });
      await brandInput.click();

      // Target active input (on mobile drawer, use drawer input .last(); on desktop use main input)
      const activeBrandInput = page.locator('input[placeholder*="brand"]').last();
      await activeBrandInput.fill("Apple");

      const brandOption = page.getByRole("option", { name: "Apple" });
      await expect(brandOption).toBeVisible({ timeout: 10_000 });
      await brandOption.click();

      // Step 3: Select Model
      const modelInput = page.getByTestId("step-one-fields").getByPlaceholder(/Search model/i);
      await expect(modelInput).toBeVisible({ timeout: 10_000 });
      await modelInput.click();

      const activeModelInput = page.locator('input[placeholder*="model"]').last();
      await activeModelInput.fill("iPhone 14");

      const modelOption = page.getByRole("option", { name: "iPhone 14 Pro" });
      await expect(modelOption).toBeVisible({ timeout: 10_000 });
      await modelOption.click();

      // Step 4: Spare parts & Condition selection (rendered as buttons with aria-pressed)
      const batteryBtn = page.getByRole("button", { name: "Battery" });
      await expect(batteryBtn).toBeVisible({ timeout: 10_000 });
      await batteryBtn.click();

      const conditionBtn = page.getByRole("button", { name: "Power On" });
      await expect(conditionBtn).toBeVisible({ timeout: 10_000 });
      await conditionBtn.click();

      // Step 5: Advance to Step 2 via Continue button
      const continueBtn = page.getByRole("button", { name: /Continue/i });
      await expect(continueBtn).toBeVisible();
      await continueBtn.click(); // Unforced click

      // Step 6: Confirm Step 2 opened
      await expect(page.getByText(/Step 2 of 2: Listing Details/i)).toBeVisible({ timeout: 15_000 });
      await page.screenshot({ path: testInfo.outputPath(`success-${vp.width}px.png`), fullPage: true });
    });
  }
});
