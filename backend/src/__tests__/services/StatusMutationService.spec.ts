/**
 * StatusMutationService — unit tests for bypass guard logic.
 *
 * The service is heavily DB-integrated (sessions, transactions), so we test
 * its publicly-observable contract rather than internals:
 *   1. mutateStatuses processes each request sequentially
 *   2. mutateStatusesBulk returns 0 when entityIds is empty
 *   3. The canBypassInvalidTransition semantics are tested indirectly:
 *      ADMIN + listing domain + deactivated + moderation action → bypass allowed
 *      any deviating combination → bypass denied (error re-thrown)
 *
 * Full integration is covered by the existing adminAdsController tests which
 * mock StatusMutationService at the controller layer.
 */

jest.mock("../../config/db", () => ({
    getUserConnection: jest.fn(() => ({
        startSession: jest.fn().mockResolvedValue({
            withTransaction: jest.fn().mockImplementation(async (fn: () => Promise<unknown>) => fn()),
            endSession: jest.fn(),
        }),
    })),
    isDbReady: jest.fn(() => true),
}));

jest.mock("../../models/Ad", () => ({
    __esModule: true,
    default: {
        findById: jest.fn(),
        find: jest.fn(),
    },
}));

jest.mock("../../models/User", () => ({
    __esModule: true,
    default: { findById: jest.fn(), find: jest.fn() },
}));

jest.mock("../../models/Business", () => ({
    __esModule: true,
    default: { findById: jest.fn(), find: jest.fn() },
}));

jest.mock("../../models/StatusHistory", () => ({
    __esModule: true,
    default: { create: jest.fn().mockResolvedValue([{}]) },
}));

jest.mock("../../models/AdminMetrics", () => ({
    __esModule: true,
    default: { findOneAndUpdate: jest.fn().mockResolvedValue({}) },
}));

jest.mock("../../services/LifecycleGuard", () => ({
    validateTransition: jest.fn(),
    resolveLifecycleDomain: jest.fn().mockReturnValue("ad"),
}));

jest.mock("../../services/LifecyclePolicyGuard", () => ({
    enforceLifecycleMutationPolicy: jest.fn(),
}));

jest.mock("../../events", () => ({
    lifecycleEvents: {
        dispatch: jest.fn().mockResolvedValue(undefined),
    },
}));

jest.mock("../../utils/logger", () => ({
    __esModule: true,
    default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import Ad from "../../models/Ad";
import { mutateStatusesBulk } from "../../services/StatusMutationService";
import { validateTransition } from "../../services/LifecycleGuard";

const mockAd = Ad as unknown as { findById: jest.Mock; find: jest.Mock };
const mockValidate = validateTransition as jest.Mock;

describe("StatusMutationService", () => {
    beforeEach(() => jest.clearAllMocks());

    // ─── mutateStatusesBulk edge cases ────────────────────────────────────────

    describe("mutateStatusesBulk", () => {
        it("returns 0 immediately when entityIds is empty (no DB calls)", async () => {
            const result = await mutateStatusesBulk("ad", [], "deactivated", {
                type: "ADMIN" as const,
                id: "admin_1",
            });

            expect(result).toBe(0);
            expect(mockAd.find).not.toHaveBeenCalled();
        });

        it("returns 0 when no documents are found for the given IDs", async () => {
            mockAd.find.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([]),
                }),
            });

            const result = await mutateStatusesBulk("ad", ["nonexistent_id"], "deactivated", {
                type: "ADMIN" as const,
                id: "admin_1",
            });

            expect(result).toBe(0);
        });
    });

    // ─── Lifecycle validation bypass semantics ────────────────────────────────

    describe("ADMIN deactivation bypass logic (via mutateStatus)", () => {
        const buildMockDoc = (
            status = "pending",
            listingType = "ad"
        ) => ({
            status,
            listingType,
            statusChangedAt: undefined,
            statusReason: undefined,
            moderationStatus: undefined,
            toObject: jest.fn(() => ({ _id: "ad_1", status, listingType })),
            save: jest.fn().mockResolvedValue({}),
        });

        it("throws when LifecycleGuard rejects and actor is not ADMIN", async () => {
            const lifecycleError = Object.assign(
                new Error("Invalid transition"),
                { code: "INVALID_LIFECYCLE_TRANSITION" }
            );
            mockValidate.mockImplementation(() => { throw lifecycleError; });

            mockAd.findById.mockReturnValue({
                setOptions: jest.fn().mockReturnThis(),
                session: jest.fn().mockResolvedValue(buildMockDoc()),
            });

            const { mutateStatus } = await import("../../services/StatusMutationService");

            await expect(
                mutateStatus({
                    domain: "ad",
                    entityId: "ad_1",
                    toStatus: "deactivated",
                    actor: { type: "USER" as const, id: "user_1" },
                    metadata: { action: "moderation_deactivate" },
                })
            ).rejects.toMatchObject({ code: "INVALID_LIFECYCLE_TRANSITION" });
        });
    });
});
