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

        const g = globalThis as Record<string, unknown>;
        const originalDoc = g.document;
        const originalWin = g.window;
        g.document = mockDoc;
        g.window = {};

        try {
            const found = scrollToFirstError();
            expect(found).toBe(true);
            expect(mockQuerySelector).toHaveBeenCalledWith(
                '[aria-invalid="true"], input.border-destructive, select.border-destructive, textarea.border-destructive, [data-invalid="true"]'
            );
            expect(mockTarget.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
            expect(mockTarget.focus).toHaveBeenCalledWith({ preventScroll: true });
        } finally {
            g.document = originalDoc;
            g.window = originalWin;
        }
    });

    it("respects containerRef boundaries when provided", () => {
        const mockTarget = {
            scrollIntoView: vi.fn(),
            focus: vi.fn(),
        };
        const mockQuerySelector = vi.fn().mockReturnValue(mockTarget);
        const mockContainer = ({ querySelector: mockQuerySelector } as Partial<HTMLElement>) as HTMLElement;

        const g = globalThis as Record<string, unknown>;
        const originalDoc = g.document;
        const originalWin = g.window;
        g.document = {};
        g.window = {};
        const containerRef = { current: mockContainer };

        try {
            const found = scrollToFirstError(containerRef);
            expect(found).toBe(true);
            expect(mockQuerySelector).toHaveBeenCalled();
            expect(mockTarget.scrollIntoView).toHaveBeenCalled();
        } finally {
            g.document = originalDoc;
            g.window = originalWin;
        }
    });
});
