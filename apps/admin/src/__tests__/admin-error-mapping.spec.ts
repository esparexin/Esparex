import { describe, it, expect } from "vitest";
import { mapErrorToMessage } from "../lib/mapErrorToMessage";

describe("mapErrorToMessage", () => {
    it("returns fallback for null/undefined error", () => {
        expect(mapErrorToMessage(null, "fallback")).toBe("fallback");
        expect(mapErrorToMessage(undefined, "fallback")).toBe("fallback");
    });

    it("returns string error directly", () => {
        expect(mapErrorToMessage("Server down", "fallback")).toBe("Server down");
    });

    it("returns trimmed string error", () => {
        expect(mapErrorToMessage("  Space error  ", "fallback")).toBe("Space error");
    });

    it("returns fallback for empty string error", () => {
        expect(mapErrorToMessage("", "fallback")).toBe("fallback");
        expect(mapErrorToMessage("   ", "fallback")).toBe("fallback");
    });

    it("extracts userMessage from error object", () => {
        expect(mapErrorToMessage({ userMessage: "Plan limit reached" }, "fallback")).toBe("Plan limit reached");
    });

    it("extracts response.data.error from Axios-shaped error", () => {
        const axiosError = { response: { data: { error: "Unauthorized access" } } };
        expect(mapErrorToMessage(axiosError, "fallback")).toBe("Unauthorized access");
    });

    it("extracts response.data.message as fallback", () => {
        const axiosError = { response: { data: { message: "Not found" } } };
        expect(mapErrorToMessage(axiosError, "fallback")).toBe("Not found");
    });

    it("extracts standard Error.message", () => {
        expect(mapErrorToMessage(new Error("Something broke"), "fallback")).toBe("Something broke");
    });

    it("suppresses transport noise messages", () => {
        expect(mapErrorToMessage(new Error("Request failed with status code 500"), "fallback")).toBe("fallback");
        expect(mapErrorToMessage(new Error("Network Error"), "fallback")).toBe("fallback");
        expect(mapErrorToMessage(new Error("timeout of 30000ms exceeded"), "fallback")).toBe("fallback");
    });

    it("returns fallback for non-string/non-object error", () => {
        expect(mapErrorToMessage(42, "fallback")).toBe("fallback");
        expect(mapErrorToMessage(true, "fallback")).toBe("fallback");
    });

    it("prioritises userMessage over response.data.error", () => {
        const error = {
            userMessage: "Friendly message",
            response: { data: { error: "Technical error" } },
            message: "Raw error",
        };
        expect(mapErrorToMessage(error, "fallback")).toBe("Friendly message");
    });
});
