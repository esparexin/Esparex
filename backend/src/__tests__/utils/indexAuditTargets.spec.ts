import { getIndexAuditTargets } from "../../core/db/indexAuditTargets";

describe("getIndexAuditTargets", () => {
    it("deduplicates a shared connection when user and admin databases are unified", () => {
        const sharedConnection = {
            id: 1,
            models: {},
        } as const;

        const targets = getIndexAuditTargets([
            { scope: "user", connection: sharedConnection },
            { scope: "admin", connection: sharedConnection },
        ]);

        expect(targets).toEqual([
            {
                scope: "user",
                connection: sharedConnection,
            },
        ]);
    });

    it("keeps distinct connections when user and admin databases are separate", () => {
        const userConnection = {
            id: 1,
            models: {},
        } as const;

        const adminConnection = {
            id: 2,
            models: {},
        } as const;

        const targets = getIndexAuditTargets([
            { scope: "user", connection: userConnection },
            { scope: "admin", connection: adminConnection },
        ]);

        expect(targets).toEqual([
            {
                scope: "user",
                connection: userConnection,
            },
            {
                scope: "admin",
                connection: adminConnection,
            },
        ]);
    });
});
