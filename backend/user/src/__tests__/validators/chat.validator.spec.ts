import { adminListQuerySchema } from '@esparex/core/validators';;

describe("adminListQuerySchema", () => {
    it("accepts canonical admin chat filters", () => {
        const parsed = adminListQuerySchema.parse({
            filter: "reported",
            q: "conv-123",
            page: "3",
            limit: "15",
        });

        expect(parsed.filter).toBe("reported");
        expect(parsed.q).toBe("conv-123");
        expect(parsed.page).toBe(3);
        expect(parsed.limit).toBe(15);
    });

    it("rejects the legacy search alias", () => {
        expect(() => adminListQuerySchema.parse({
            search: "conv-123",
        })).toThrow(/search|q/i);
    });
});
