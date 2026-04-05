import { describe, expect, it } from "vitest";

import { APIError } from "@/lib/api/APIError";
import { toApiResult } from "@/lib/api/result";
import { ErrorCategory, ErrorCode, EsparexError } from "@/lib/errorHandler";

describe("toApiResult", () => {
    it("preserves network APIError metadata when converting to EsparexError", async () => {
        const result = await toApiResult<never>(
            Promise.reject(
                new APIError({
                    status: 0,
                    code: "NETWORK_FAILURE",
                    message: "Unable to connect to server.",
                    source: "network",
                    context: {
                        endpoint: "businesses/me",
                    },
                })
            )
        );

        expect(result.data).toBeNull();
        expect(result.statusCode).toBe(0);
        expect(result.error).toBeInstanceOf(EsparexError);
        expect(result.error).toMatchObject({
            code: ErrorCode.NETWORK_SERVER_ERROR,
            category: ErrorCategory.NETWORK,
            retryable: true,
            context: {
                statusCode: 0,
                source: "network",
                endpoint: "businesses/me",
                backendErrorCode: "NETWORK_FAILURE",
                backendErrorMessage: "Unable to connect to server.",
            },
        });
        expect(result.error?.technicalMessage).toContain("businesses/me");
    });

    it("preserves health-gate APIError metadata when converting to EsparexError", async () => {
        const result = await toApiResult<never>(
            Promise.reject(
                new APIError({
                    status: 503,
                    code: "BACKEND_UNAVAILABLE",
                    message: "Backend service unavailable.",
                    source: "health-gate",
                    context: {
                        endpoint: "businesses/me/stats",
                        backendErrorCode: "BACKEND_UNAVAILABLE",
                        backendErrorMessage: "Backend service unavailable.",
                    },
                })
            )
        );

        expect(result.data).toBeNull();
        expect(result.statusCode).toBe(503);
        expect(result.error).toBeInstanceOf(EsparexError);
        expect(result.error).toMatchObject({
            code: ErrorCode.NETWORK_SERVER_ERROR,
            category: ErrorCategory.NETWORK,
            isExpected: true,
            context: {
                statusCode: 503,
                source: "health-gate",
                endpoint: "businesses/me/stats",
                backendErrorCode: "BACKEND_UNAVAILABLE",
                backendErrorMessage: "Backend service unavailable.",
            },
        });
    });
});
