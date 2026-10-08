import { describe, expect, it } from "vitest";
import { APIClient, apiClient } from "@/lib/api/client";
import { isSendOtpRequest, isAuthMutationRequest } from "@/lib/api/requestMatchers";

describe("APIClient Health Gate Resilience", () => {
    it("exports APIClient class and singleton apiClient proxy", () => {
        expect(APIClient).toBeDefined();
        expect(apiClient).toBeDefined();
        expect(typeof apiClient.get).toBe("function");
        expect(typeof apiClient.post).toBe("function");
    });

    it("creates an APIClient instance with checkHealth and HTTP methods", () => {
        const client = new APIClient();
        expect(typeof client.checkHealth).toBe("function");
        expect(typeof client.get).toBe("function");
        expect(typeof client.post).toBe("function");
        expect(typeof client.put).toBe("function");
        expect(typeof client.patch).toBe("function");
        expect(typeof client.delete).toBe("function");
        expect(typeof client.getCsrfToken).toBe("function");
    });

    it("identifies send-otp endpoints across all URL formats to prevent transient auto-retries", () => {
        expect(isSendOtpRequest("auth/send-otp")).toBe(true);
        expect(isSendOtpRequest("/auth/send-otp")).toBe(true);
        expect(isSendOtpRequest("/api/v1/auth/send-otp")).toBe(true);
        expect(isSendOtpRequest("https://api.esparex.in/api/v1/auth/send-otp")).toBe(true);
        expect(isSendOtpRequest("https://api.esparex.in/auth/send-otp")).toBe(true);
        expect(isSendOtpRequest("/api/v1/listings")).toBe(false);
        expect(isSendOtpRequest(undefined)).toBe(false);
    });

    it("identifies all auth mutation endpoints to prevent transient auto-retries", () => {
        expect(isAuthMutationRequest("auth/send-otp")).toBe(true);
        expect(isAuthMutationRequest("auth/verify-otp")).toBe(true);
        expect(isAuthMutationRequest("/api/v1/auth/verify-otp")).toBe(true);
        expect(isAuthMutationRequest("https://api.esparex.in/api/v1/auth/verify-otp")).toBe(true);
        expect(isAuthMutationRequest("auth/cancel-otp")).toBe(true);
        expect(isAuthMutationRequest("/api/v1/auth/cancel-otp")).toBe(true);
        expect(isAuthMutationRequest("catalog/categories")).toBe(false);
        expect(isAuthMutationRequest(undefined)).toBe(false);
    });
});
