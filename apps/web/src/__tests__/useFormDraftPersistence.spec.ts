import { getBusinessDraftKey, type DraftStorageEnvelope } from "../hooks/useFormDraftPersistence";

describe("useFormDraftPersistence — Envelope & Key Storage Specifications", () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it("generates versioned draft storage keys incorporating userId", () => {
        expect(getBusinessDraftKey("user_999")).toBe("esparex:draft:v1:business:user_999");
        expect(getBusinessDraftKey(null)).toBe("esparex:draft:v1:business:anonymous");
    });

    it("serializes and deserializes versioned draft storage envelopes", () => {
        const key = getBusinessDraftKey("user_999");
        const envelope: DraftStorageEnvelope<{ name: string }> = {
            version: 1,
            updatedAt: Date.now(),
            idempotencyKey: "123e4567-e89b-12d3-a456-426614174000",
            form: { name: "Test Auto Repair" },
        };

        sessionStorage.setItem(key, JSON.stringify(envelope));

        const storedRaw = sessionStorage.getItem(key);
        expect(storedRaw).not.toBeNull();

        const parsed = JSON.parse(storedRaw!) as DraftStorageEnvelope<{ name: string }>;
        expect(parsed.version).toBe(1);
        expect(parsed.idempotencyKey).toBe("123e4567-e89b-12d3-a456-426614174000");
        expect(parsed.form.name).toBe("Test Auto Repair");
    });

    it("rejects expired draft envelopes (> 24 hours)", () => {
        const key = getBusinessDraftKey("user_999");
        const expiredTime = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
        const envelope: DraftStorageEnvelope<{ name: string }> = {
            version: 1,
            updatedAt: expiredTime,
            idempotencyKey: "123e4567-e89b-12d3-a456-426614174000",
            form: { name: "Expired Workshop" },
        };

        sessionStorage.setItem(key, JSON.stringify(envelope));

        const storedRaw = sessionStorage.getItem(key);
        const parsed = JSON.parse(storedRaw!) as DraftStorageEnvelope<{ name: string }>;
        const isExpired = Date.now() - parsed.updatedAt > 24 * 60 * 60 * 1000;

        expect(isExpired).toBe(true);
    });
});
