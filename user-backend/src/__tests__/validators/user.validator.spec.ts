import { getUsersQuerySchema, updateUserProfileSchema } from "@core/validators/user.validator";

describe("getUsersQuerySchema", () => {
    it("accepts canonical admin user filters", () => {
        const parsed = getUsersQuerySchema.parse({
            q: "rahul",
            status: "live",
            isVerified: "true",
            page: "2",
            limit: "25",
        });

        expect(parsed.q).toBe("rahul");
        expect(parsed.status).toBe("live");
        expect(parsed.isVerified).toBe(true);
        expect(parsed.page).toBe(2);
        expect(parsed.limit).toBe(25);
    });

    it("rejects the legacy search alias", () => {
        expect(() => getUsersQuerySchema.parse({
            search: "rahul",
        })).toThrow(/search|q/i);
    });
});

describe("updateUserProfileSchema", () => {
    it("accepts canonical profile update fields", () => {
        const parsed = updateUserProfileSchema.parse({
            name: "Rahul",
            email: "rahul@example.com",
            mobileVisibility: "show",
        });

        expect(parsed.name).toBe("Rahul");
        expect(parsed.email).toBe("rahul@example.com");
        expect(parsed.mobileVisibility).toBe("show");
    });

    it("rejects legacy phone in profile updates", () => {
        expect(() => updateUserProfileSchema.parse({
            phone: "9876543210",
        })).toThrow(/phone|mobile/i);
    });

    it("rejects direct mobile mutation in profile updates", () => {
        expect(() => updateUserProfileSchema.parse({
            mobile: "9876543210",
        })).toThrow(/mobile/i);
    });
});
