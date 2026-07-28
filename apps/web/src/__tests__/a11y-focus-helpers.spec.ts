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

        const originalDoc = (globalThis as unknown as { document: unknown }).document;
        const originalWin = (globalThis as unknown as { window: unknown }).window;
        (globalThis as unknown as { document: unknown }).document = mockDoc;
        (globalThis as unknown as { window: unknown }).window = {};

        try {
            const found = scrollToFirstError();
            expect(found).toBe(true);
            expect(mockQuerySelector).toHaveBeenCalledWith(
                '[aria-invalid="true"], input.border-destructive, select.border-destructive, textarea.border-destructive, [data-invalid="true"]'
            );
            expect(mockTarget.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
            expect(mockTarget.focus).toHaveBeenCalledWith({ preventScroll: true });
        } finally {
            (globalThis as unknown as { document: unknown }).document = originalDoc;
            (globalThis as unknown as { window: unknown }).window = originalWin;
        }
    });

    it("respects containerRef boundaries when provided", () => {
        const mockTarget = {
            scrollIntoView: vi.fn(),
            focus: vi.fn(),
        };
        const mockQuerySelector = vi.fn().mockReturnValue(mockTarget);
        const mockContainer = { querySelector: mockQuerySelector } as unknown as HTMLElement;

        const originalDoc = (globalThis as unknown as { document: unknown }).document;
        const originalWin = (globalThis as unknown as { window: unknown }).window;
        (globalThis as unknown as { document: unknown }).document = {};
        (globalThis as unknown as { window: unknown }).window = {};
        const containerRef = { current: mockContainer };

        try {
            const found = scrollToFirstError(containerRef);
            expect(found).toBe(true);
            expect(mockQuerySelector).toHaveBeenCalled();
            expect(mockTarget.scrollIntoView).toHaveBeenCalled();
        } finally {
            (globalThis as unknown as { document: unknown }).document = originalDoc;
            (globalThis as unknown as { window: unknown }).window = originalWin;
        }
    });
});
