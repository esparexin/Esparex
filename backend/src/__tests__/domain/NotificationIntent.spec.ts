import { NotificationIntent } from "../../domain/NotificationIntent";
import { NOTIFICATION_TYPE } from "@shared/enums/notificationType";

describe("NotificationIntent", () => {
    it("uses medium priority for admin broadcasts", () => {
        const intent = NotificationIntent.fromAdminBroadcast(
            "user-1",
            "broadcast-1",
            "Maintenance Window",
            "We will be briefly offline tonight."
        );

        expect(intent.priority).toBe("medium");
        expect(intent.type).toBe(NOTIFICATION_TYPE.SYSTEM);
        expect(intent.entityRef).toEqual({ domain: "admin_broadcast", id: "broadcast-1" });
    });

    it("uses medium priority by default when none is provided", () => {
        const intent = new NotificationIntent({
            userId: "user-1",
            type: NOTIFICATION_TYPE.SYSTEM,
            entityRef: { domain: "system", id: "system-1" },
            message: { title: "Hello", body: "World" },
        });

        expect(intent.priority).toBe("medium");
    });
});
