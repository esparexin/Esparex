import { adminAuditLogQuerySchema } from '@esparex/core/validators';;

describe("adminAuditLogQuerySchema", () => {
    it("accepts canonical audit log filters", () => {
        const parsed = adminAuditLogQuerySchema.parse({
            q: "wallet",
            action: "ADJUST_WALLET",
            adminId: "507f1f77bcf86cd799439011",
            page: "2",
            limit: "25",
        });

        expect(parsed.q).toBe("wallet");
        expect(parsed.action).toBe("ADJUST_WALLET");
        expect(parsed.adminId).toBe("507f1f77bcf86cd799439011");
        expect(parsed.page).toBe(2);
        expect(parsed.limit).toBe(25);
    });

    it("rejects the legacy search alias", () => {
        expect(() => adminAuditLogQuerySchema.parse({
            search: "wallet",
        })).toThrow(/search|q/i);
    });
});
