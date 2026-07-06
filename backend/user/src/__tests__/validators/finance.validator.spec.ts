import { adminInvoiceQuerySchema, adminPlanQuerySchema, adminTransactionQuerySchema,  } from '@esparex/core/validators';;

describe("admin finance query schemas", () => {
    it("accepts canonical transaction filters", () => {
        const parsed = adminTransactionQuerySchema.parse({
            q: "order-123",
            status: "SUCCESS",
            page: "2",
            limit: "50",
        });

        expect(parsed.q).toBe("order-123");
        expect(parsed.status).toBe("SUCCESS");
        expect(parsed.page).toBe(2);
        expect(parsed.limit).toBe(50);
    });

    it("accepts canonical invoice filters", () => {
        const parsed = adminInvoiceQuerySchema.parse({
            q: "INV-1001",
            status: "PENDING",
        });

        expect(parsed.q).toBe("INV-1001");
        expect(parsed.status).toBe("PENDING");
    });

    it("accepts canonical plan filters", () => {
        const parsed = adminPlanQuerySchema.parse({
            q: "premium",
            type: "AD_PACK",
        });

        expect(parsed.q).toBe("premium");
        expect(parsed.type).toBe("AD_PACK");
    });

    it("rejects the legacy search alias across finance filters", () => {
        expect(() => adminTransactionQuerySchema.parse({ search: "legacy" })).toThrow(/search|q/i);
        expect(() => adminInvoiceQuerySchema.parse({ search: "legacy" })).toThrow(/search|q/i);
        expect(() => adminPlanQuerySchema.parse({ search: "legacy" })).toThrow(/search|q/i);
    });
});
