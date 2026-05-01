import { describe, expect, it, vi } from "vitest";

import { APIError } from "@/lib/api/APIError";
import { injectApiErrors } from "@/lib/injectApiErrors";
import { ErrorCategory, ErrorCode, ErrorSeverity, EsparexError } from "@/lib/errorHandler";

describe("injectApiErrors", () => {
    it("injects field errors from nested APIError details payloads", () => {
        const form = {
            setError: vi.fn(),
        } as any;

        const injected = injectApiErrors(
            form,
            new APIError({
                status: 400,
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: {
                    details: [
                        { field: "title", message: "Title is required" },
                    ],
                },
                source: "backend",
            })
        );

        expect(injected).toBe(true);
        expect(form.setError).toHaveBeenCalledWith("title", {
            type: "server",
            message: "Title is required",
        });
    });

    it("injects field errors from EsparexError context details", () => {
        const form = {
            setError: vi.fn(),
        } as any;

        const injected = injectApiErrors(
            form,
            new EsparexError({
                code: ErrorCode.DATA_SAVE_FAILED,
                category: ErrorCategory.DATA_SAVE,
                severity: ErrorSeverity.MEDIUM,
                userMessage: "Please fix the highlighted fields.",
                technicalMessage: "Validation failed while creating listing",
                context: {
                    details: [
                        { field: "price", message: "Price must be greater than zero" },
                    ],
                },
            })
        );

        expect(injected).toBe(true);
        expect(form.setError).toHaveBeenCalledWith("price", {
            type: "server",
            message: "Price must be greater than zero",
        });
    });
});
