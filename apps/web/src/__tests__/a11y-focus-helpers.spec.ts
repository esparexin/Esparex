import { describe, expect, it, vi } from "vitest";
import { scrollToFirstError } from "../lib/formHelpers";

describe("Accessibility & Form Focus Helpers Specifications", () => {
    it("returns false cleanly when window/document is undefined", () => {
        expect(scrollToFirstError()).toBe(false);
    });

    it("queries for target element and invokes scrollIntoView and focus when element exists", () => {
        const mockTarget = {
            scrollIntoView: vi.fn(),
            focus: vi.fn(),
        };

        const mockQuerySelector = vi.fn().mockReturnValue(mockTarget);
        const mockDoc = { querySelector: mockQuerySelector };

        const originalDoc = (globalThis as any).document;
        const originalWin = (globalThis as any).window;
        (globalThis as any).document = mockDoc;
        (globalThis as any).window = {};

        try {
            const found = scrollToFirstError();
            expect(found).toBe(true);
            expect(mockQuerySelector).toHaveBeenCalledWith(
                '[aria-invalid="true"], input.border-destructive, select.border-destructive, textarea.border-destructive, [data-invalid="true"]'
            );
            expect(mockTarget.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
            expect(mockTarget.focus).toHaveBeenCalledWith({ preventScroll: true });
        } finally {
            (globalThis as any).document = originalDoc;
            (globalThis as any).window = originalWin;
        }
    });

    it("respects containerRef boundaries when provided", () => {
        const mockTarget = {
            scrollIntoView: vi.fn(),
            focus: vi.fn(),
        };
        const mockQuerySelector = vi.fn().mockReturnValue(mockTarget);
        const mockContainer = { querySelector: mockQuerySelector } as any;

        const originalDoc = (globalThis as any).document;
        const originalWin = (globalThis as any).window;
        (globalThis as any).document = {};
        (globalThis as any).window = {};
        const containerRef = { current: mockContainer };

        try {
            const found = scrollToFirstError(containerRef);
            expect(found).toBe(true);
            expect(mockQuerySelector).toHaveBeenCalled();
            expect(mockTarget.scrollIntoView).toHaveBeenCalled();
        } finally {
            (globalThis as any).document = originalDoc;
            (globalThis as any).window = originalWin;
        }
    });
});
