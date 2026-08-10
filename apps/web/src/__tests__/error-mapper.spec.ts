import { describe, expect, it } from "vitest";
import { mapErrorToMessage } from "@/lib/errorMapper";

describe("mapErrorToMessage", () => {
    it("returns the fallback when error is null", () => {
        expect(mapErrorToMessage(null, "Default message")).toBe("Default message");
    });

    it("returns generic message when error is null and no fallback given", () => {
        expect(mapErrorToMessage(null)).toBe("An unexpected error occurred");
    });

    it("maps VALIDATION_ERROR code to contextual guidance", () => {
        const err = { code: "VALIDATION_ERROR" };
        expect(mapErrorToMessage(err)).toBe(
            "Please review the highlighted fields and correct any errors."
        );
    });

    it("maps QUOTA_EXHAUSTED code to contextual guidance", () => {
        const err = { code: "QUOTA_EXHAUSTED" };
        expect(mapErrorToMessage(err)).toBe(
            "Ad posting quota exhausted. Buy an ad pack to continue."
        );
    });

    it("maps LISTING_LIMIT_EXCEEDED code to contextual guidance", () => {
        const err = { code: "LISTING_LIMIT_EXCEEDED" };
        expect(mapErrorToMessage(err)).toBe(
            "Free listing quota reached. Upgrade your plan to post more ads."
        );
    });

    it("maps IMAGE_MODERATION_FAILED code to contextual guidance", () => {
        const err = { code: "IMAGE_MODERATION_FAILED" };
        expect(mapErrorToMessage(err)).toBe(
            "Image flagged by moderation policy. Please upload a clear product photo."
        );
    });

    it("maps HTTP 401 status to contextual login message", () => {
        const err = { status: 401 };
        expect(mapErrorToMessage(err)).toBe("Please log in to continue");
    });

    it("maps HTTP 413 status to contextual image size message", () => {
        const err = { status: 413 };
        expect(mapErrorToMessage(err)).toBe(
            "Uploaded images are too large. Please use smaller images or fewer photos."
        );
    });

    it("maps HTTP 429 status to rate limit message", () => {
        const err = { status: 429 };
        expect(mapErrorToMessage(err)).toBe(
            "You're trying too quickly. Please wait a moment before trying again."
        );
    });

    it("returns fallback for unrecognised errors without leaking raw message", () => {
        const err = new Error("secret internal error detail xyz");
        const result = mapErrorToMessage(err, "Something went wrong");
        expect(result).not.toContain("secret internal error detail xyz");
        expect(result).toBe("Something went wrong");
    });

    it("returns userMessage from EsparexError-shaped objects", () => {
        const err = { userMessage: "Your account is under review." };
        expect(mapErrorToMessage(err)).toBe("Your account is under review.");
    });

    it("prefers code mapping over HTTP status", () => {
        const err = { code: "VALIDATION_ERROR", status: 400 };
        expect(mapErrorToMessage(err)).toBe(
            "Please review the highlighted fields and correct any errors."
        );
    });
});
