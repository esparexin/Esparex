import { describe, it, expect, beforeEach, vi } from "vitest";
import { NOTIFICATION_TYPE } from '@esparex/contracts';
import User from "../../models/User";
import { resolveNotificationDeliveryPlan } from "../../domains/notifications/application/NotificationPreferenceService";

vi.mock("../../models/User", () => ({
    default: {
        findById: vi.fn(),
    },
}));

describe("NotificationPreferenceService (Single Toggle Consolidation)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("suppresses general notifications when enabled is false", async () => {
        const select = vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue({
                notificationSettings: { enabled: false }
            })
        });
        (User.findById as any).mockReturnValue({ select });

        const plan = await resolveNotificationDeliveryPlan({
            userId: "user-1",
            type: NOTIFICATION_TYPE.AD_STATUS,
            channels: ["push", "email"]
        });

        expect(plan.suppress).toBe(true);
        expect(plan.channels).toEqual([]);
    });

    it("allows general notifications when enabled is true", async () => {
        const select = vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue({
                notificationSettings: { enabled: true }
            })
        });
        (User.findById as any).mockReturnValue({ select });

        const plan = await resolveNotificationDeliveryPlan({
            userId: "user-1",
            type: NOTIFICATION_TYPE.AD_STATUS,
            channels: ["push", "email"]
        });

        expect(plan.suppress).toBe(false);
        expect(plan.channels).toEqual(["push", "email"]);
    });

    it("suppresses Smart Alerts when general enabled setting is false", async () => {
        const select = vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue({
                notificationSettings: { enabled: false }
            })
        });
        (User.findById as any).mockReturnValue({ select });

        const plan = await resolveNotificationDeliveryPlan({
            userId: "user-1",
            type: NOTIFICATION_TYPE.SMART_ALERT,
            channels: ["email"]
        });

        expect(plan.suppress).toBe(true);
        expect(plan.channels).toEqual([]);
    });
});
