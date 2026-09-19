import { describe, expect, it } from "vitest";
import { APIClient, apiClient } from "@/lib/api/client";

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
});
