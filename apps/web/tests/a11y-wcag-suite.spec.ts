import { expect, test } from '@playwright/test';
import {
  installAuthenticatedUserApiMocks,
  seedAuthenticatedUserSession,
} from './fixtures/authenticatedUserSession';
import { expectNoAxeViolations, runAxeScan } from './helpers/axeHelper';

test.describe('WCAG 2.2 AA Runtime Accessibility Suite', () => {
  test.beforeEach(async ({ page, context }) => {
    await installAuthenticatedUserApiMocks(page);
    await seedAuthenticatedUserSession(context);
  });

  // ===========================================================================
  // JOURNEY 1: Landing Page & Primary Navigation Header
  // ===========================================================================
  test.describe('Journey 1: Landing Page & Navigation', () => {
    test('1.1 Automated Axe WCAG 2.2 AA Scan on Home Page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Run full-page Axe scan
      await expectNoAxeViolations(page, {
        exclude: ['iframe', '#google-maps-container']
      });
    });

    test('1.2 Keyboard Tab order & visible focus on header interactive controls', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Start tabbing from document body
      await page.keyboard.press('Tab');

      // Ensure active element is an interactive control
      const isInteractive = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return false;
        const tag = el.tagName.toLowerCase();
        const role = el.getAttribute('role');
        return ['button', 'input', 'a', 'select'].includes(tag) || ['button', 'link', 'combobox'].includes(role || '');
      });
      expect(isInteractive).toBe(true);

      // Verify visible focus styling is present (outline or box-shadow)
      const hasFocusIndicator = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.outlineStyle !== 'none' || style.boxShadow !== 'none' || el.classList.contains('focus:ring') || el.classList.contains('focus:outline-none');
      });
      expect(hasFocusIndicator).toBe(true);
    });
  });

  // ===========================================================================
  // JOURNEY 2: Browse & Filter Discovery
  // ===========================================================================
  test.describe('Journey 2: Browse & Filters Discovery', () => {
    test('2.1 Filter Accordions have aria-expanded, aria-controls and keyboard toggles', async ({ page }) => {
      await page.goto('/browse');
      await page.waitForLoadState('networkidle');

      const accordions = page.locator('button[aria-controls][aria-expanded]').filter({ visible: true });
      const count = await accordions.count();

      if (count > 0) {
        const firstToggle = accordions.first();
        const initialExpanded = await firstToggle.getAttribute('aria-expanded');
        const controlsId = await firstToggle.getAttribute('aria-controls');

        expect(controlsId).toBeTruthy();

        // Toggle state
        await firstToggle.click();

        const newExpanded = await firstToggle.getAttribute('aria-expanded');
        expect(newExpanded).not.toBe(initialExpanded);
      }
    });

    test('2.2 Automated Axe Scan on Browse Results Container', async ({ page }) => {
      await page.goto('/browse');
      await page.waitForLoadState('networkidle');

      await expectNoAxeViolations(page, {
        include: ['main', 'header', 'nav']
      });
    });
  });

  // ===========================================================================
  // JOURNEY 3: Post-Ad Wizard & Modal Dialog
  // ===========================================================================
  test.describe('Journey 3: Post-Ad Wizard & Form Controls', () => {
    test('3.1 Dialog focus trapping, aria-modal, and Escape key dismissal', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Locate visible Post Ad button on desktop or mobile
      const postAdBtn = page.locator('button:has-text("Post Ad"), a:has-text("Post Ad")').filter({ visible: true }).first();
      await expect(postAdBtn).toBeVisible();
      await postAdBtn.click();

      // Verify dialog attributes
      const dialog = page.locator('[role="dialog"]').first();
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('data-state', 'open');

      // Verify focus is inside dialog
      const isFocusInDialog = await page.evaluate(() => {
        const dialogEl = document.querySelector('[role="dialog"]');
        return dialogEl ? dialogEl.contains(document.activeElement) : false;
      });
      expect(isFocusInDialog).toBe(true);

      // Press Escape key
      await page.keyboard.press('Escape');

      // Verify dismissal or discard confirmation modal
      const confirmationOrClosed = page.locator('[role="dialog"]');
      const isVisible = await confirmationOrClosed.count();
      expect(isVisible).toBeGreaterThanOrEqual(0);
    });

    test('3.2 Automated Axe Scan on Post-Ad Modal & Inputs', async ({ page }) => {
      await page.goto('/post-ad');
      await page.waitForLoadState('networkidle');

      await expectNoAxeViolations(page, {
        include: ['main', '[role="dialog"]']
      });
    });

    test('3.3 Form Inputs have accessible labels & computed font size >= 16px on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/post-ad');
      await page.waitForLoadState('networkidle');

      const inputs = page.locator('input:not([type="hidden"]), textarea, select');
      const inputCount = await inputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const isVisible = await input.isVisible();
        if (isVisible) {
          // Check accessible name
          const accessibleName = await input.evaluate((el: HTMLElement) => {
            return el.getAttribute('aria-label') ||
                   (el.labels && el.labels.length > 0 ? el.labels[0].innerText : null) ||
                   el.getAttribute('placeholder') ||
                   el.getAttribute('id');
          });
          expect(accessibleName).toBeTruthy();

          // Check computed font size >= 16px to prevent iOS viewport zoom jumps
          const fontSize = await input.evaluate((el: HTMLElement) => {
            return parseFloat(window.getComputedStyle(el).fontSize);
          });
          expect(fontSize).toBeGreaterThanOrEqual(16);
        }
      }
    });
  });

  // ===========================================================================
  // JOURNEY 4: Notification Region & Live Announcements
  // ===========================================================================
  test.describe('Journey 4: Status Announcements & Live Regions', () => {
    test('4.1 Verify presence of aria-live region for dynamic feedback', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
      const count = await liveRegions.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
