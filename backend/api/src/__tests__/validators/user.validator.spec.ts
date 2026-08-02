import { getUsersQuerySchema, updateUserProfileSchema, registerFcmTokenSchema } from "@esparex/core/validators/user.validator";

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

describe("registerFcmTokenSchema", () => {
    it("accepts valid push token and platform", () => {
        const parsed = registerFcmTokenSchema.parse({
            token: "ExponentPushToken[1234567890]",
            platform: "ios",
        });

        expect(parsed.token).toBe("ExponentPushToken[1234567890]");
        expect(parsed.platform).toBe("ios");
    });

    it("defaults platform to web if not provided", () => {
        const parsed = registerFcmTokenSchema.parse({
            token: "ExponentPushToken[1234567890]",
        });

        expect(parsed.token).toBe("ExponentPushToken[1234567890]");
        expect(parsed.platform).toBe("web");
    });

    it("accepts android platform", () => {
        const parsed = registerFcmTokenSchema.parse({
            token: "ExponentPushToken[1234567890]",
            platform: "android",
        });

        expect(parsed.platform).toBe("android");
    });

    it("rejects token under 10 characters", () => {
        expect(() => registerFcmTokenSchema.parse({
            token: "short",
            platform: "ios",
        })).toThrow();
    });
});

