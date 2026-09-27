import { describe, it, expect } from "vitest";
import { normalizeIndianMobileInput, authMobileSchema } from "@esparex/contracts";
import { normalizeTo10Digits, validateIndianMobile } from "@/lib/mobileUtils";

describe("Mobile Login Autofill, Phone Normalization & Gesture Suite", () => {
  describe("Phone Number Autofill & Normalization SSOT", () => {
    it("normalizes all 4 standard user inputs to the exact 10-digit Indian mobile number", () => {
      // 1. Hyphenated with +91
      expect(normalizeIndianMobileInput("+91-9030787819")).toBe("9030787819");
      expect(normalizeTo10Digits("+91-9030787819")).toBe("9030787819");
      expect(authMobileSchema.parse("+91-9030787819")).toBe("9030787819");
      expect(validateIndianMobile("+91-9030787819")).toBe(true);

      // 2. Unhyphenated with +91
      expect(normalizeIndianMobileInput("+919030787819")).toBe("9030787819");
      expect(normalizeTo10Digits("+919030787819")).toBe("9030787819");
      expect(authMobileSchema.parse("+919030787819")).toBe("9030787819");
      expect(validateIndianMobile("+919030787819")).toBe(true);

      // 3. 12-digit number with 91 prefix without plus
      expect(normalizeIndianMobileInput("919030787819")).toBe("9030787819");
      expect(normalizeTo10Digits("919030787819")).toBe("9030787819");
      expect(authMobileSchema.parse("919030787819")).toBe("9030787819");
      expect(validateIndianMobile("919030787819")).toBe(true);

      // 4. Bare 10-digit number
      expect(normalizeIndianMobileInput("9030787819")).toBe("9030787819");
      expect(normalizeTo10Digits("9030787819")).toBe("9030787819");
      expect(authMobileSchema.parse("9030787819")).toBe("9030787819");
      expect(validateIndianMobile("9030787819")).toBe(true);
    });

    it("preserves legitimate 10-digit Indian numbers starting with 91 without stripping them to 8 digits", () => {
      const numberStartingWith91 = "9187654321";
      expect(normalizeIndianMobileInput(numberStartingWith91)).toBe("9187654321");
      expect(authMobileSchema.parse(numberStartingWith91)).toBe("9187654321");
      expect(validateIndianMobile(numberStartingWith91)).toBe(true);
    });

    it("handles common browser autofill formats with leading zeros and spaces", () => {
      expect(normalizeIndianMobileInput("09030787819")).toBe("9030787819");
      expect(normalizeIndianMobileInput("+91 90307 87819")).toBe("9030787819");
      expect(normalizeIndianMobileInput("  +91-90307-87819  ")).toBe("9030787819");
    });
  });

  describe("Drawer Swipe-Down Dismissal Thresholds", () => {
    const DRAG_CLOSE_THRESHOLD = 60;
    const VELOCITY_THRESHOLD = 0.4;

    function shouldDismissDrawer(dragOffsetY: number, elapsedMs: number): boolean {
      const velocity = dragOffsetY / Math.max(1, elapsedMs);
      return dragOffsetY >= DRAG_CLOSE_THRESHOLD || (dragOffsetY > 25 && velocity > VELOCITY_THRESHOLD);
    }

    it("triggers dismissal when drag displacement reaches or exceeds 60px", () => {
      expect(shouldDismissDrawer(60, 200)).toBe(true);
      expect(shouldDismissDrawer(100, 300)).toBe(true);
    });

    it("triggers dismissal on quick downward flick above velocity threshold", () => {
      // 30px displacement in 50ms = 0.6 px/ms (> 0.4)
      expect(shouldDismissDrawer(30, 50)).toBe(true);
    });

    it("snaps back without dismissal on small, slow drag movements", () => {
      // 20px displacement
      expect(shouldDismissDrawer(20, 200)).toBe(false);
      // 40px displacement over 200ms = 0.2 px/ms (< 0.4 and < 60px)
      expect(shouldDismissDrawer(40, 200)).toBe(false);
    });
  });

  describe("Visual Viewport Android vs iOS Keyboard Invariants", () => {
    function computeViewportState(params: {
      maxObservedHeight: number;
      layoutHeight: number;
      currentHeight: number;
    }) {
      const { maxObservedHeight, layoutHeight, currentHeight } = params;
      const benchmarkHeight = Math.max(maxObservedHeight, layoutHeight);
      const keyboardActive = currentHeight < benchmarkHeight * 0.82;
      const computedKeyboardHeight = keyboardActive
        ? Math.max(0, Math.round(layoutHeight - currentHeight))
        : 0;

      return { keyboardActive, computedKeyboardHeight };
    }

    it("correctly identifies active keyboard on Android with interactiveWidget: 'resizes-content'", () => {
      // On Android: initial unconstrained height 800px; keyboard shrinks both innerHeight and visualViewport to 500px
      const state = computeViewportState({
        maxObservedHeight: 800,
        layoutHeight: 500,
        currentHeight: 500,
      });

      // Keyboard must be detected as active to hide decorative logos
      expect(state.keyboardActive).toBe(true);
      // CSS elevation must be 0px because layout viewport already resized above keyboard
      expect(state.computedKeyboardHeight).toBe(0);
    });

    it("correctly calculates keyboard height on iOS Safari where layout viewport stays static", () => {
      // On iOS Safari: layoutHeight stays 844px; visualViewport shrinks to 500px
      const state = computeViewportState({
        maxObservedHeight: 844,
        layoutHeight: 844,
        currentHeight: 500,
      });

      expect(state.keyboardActive).toBe(true);
      // CSS elevation raises drawer by 344px
      expect(state.computedKeyboardHeight).toBe(344);
    });
  });
});
