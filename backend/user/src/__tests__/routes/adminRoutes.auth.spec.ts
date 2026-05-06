import express from "express";
import inject, { InjectOptions, Response as InjectResponse } from "light-my-request";
import cookieParser from "cookie-parser";

import { requireAdmin } from "../../middleware/adminAuth";

const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());

    app.post("/api/v1/admin/auth/login", (_req, res) => {
        res.status(400).json({ success: false, error: "Invalid credentials" });
    });

    const protectedRouter = express.Router();
    protectedRouter.use(requireAdmin);
    protectedRouter.get("/dashboard/stats", (_req, res) => res.json({ success: true }));
    protectedRouter.get("/users", (_req, res) => res.json({ success: true }));
    protectedRouter.get("/admin-users", (_req, res) => res.json({ success: true }));
    protectedRouter.get("/admin-users/:id", (_req, res) => res.json({ success: true }));
    protectedRouter.patch("/users/:id/status", (_req, res) => res.json({ success: true }));
    protectedRouter.get("/ads", (_req, res) => res.json({ success: true }));
    protectedRouter.get("/plans", (_req, res) => res.json({ success: true }));
    protectedRouter.post("/plans", (_req, res) => res.json({ success: true }));
    protectedRouter.get("/finance/transactions", (_req, res) => res.json({ success: true }));
    protectedRouter.get("/notifications/history", (_req, res) => res.json({ success: true }));
    protectedRouter.post("/notifications/send", (_req, res) => res.json({ success: true }));
    protectedRouter.get("/invoices", (_req, res) => res.json({ success: true }));
    protectedRouter.get("/invoices/:id", (_req, res) => res.json({ success: true }));
    protectedRouter.post("/invoices", (_req, res) => res.json({ success: true }));
    protectedRouter.patch("/invoices/:id/status", (_req, res) => res.json({ success: true }));
    protectedRouter.get("/chat/list", (_req, res) => res.json({ success: true }));
    protectedRouter.patch("/ads/:id/status", (_req, res) => res.json({ success: true }));
    protectedRouter.delete("/admin-users/:id", (_req, res) => res.json({ success: true }));

    app.use("/api/v1/admin", protectedRouter);
    return app;
};

describe("admin route auth contract", () => {
    const app = buildApp();

    it("protects representative admin endpoints with 401 when no admin cookie is present", async () => {
        const checks = [
            ["dashboard stats", { method: "GET", url: "/api/v1/admin/dashboard/stats" }],
            ["users list", { method: "GET", url: "/api/v1/admin/users" }],
            ["admin users list", { method: "GET", url: "/api/v1/admin/admin-users" }],
            ["admin user detail", { method: "GET", url: "/api/v1/admin/admin-users/65fa29c9d2c1f2e165fa29c9" }],
            ["user status update", { method: "PATCH", url: "/api/v1/admin/users/65fa29c9d2c1f2e165fa29c9/status", payload: { status: "suspended" } }],
            ["ads list", { method: "GET", url: "/api/v1/admin/ads" }],
            ["plans list", { method: "GET", url: "/api/v1/admin/plans" }],
            ["plans create", { method: "POST", url: "/api/v1/admin/plans", payload: {} }],
            ["finance transactions", { method: "GET", url: "/api/v1/admin/finance/transactions" }],
            ["notification history", { method: "GET", url: "/api/v1/admin/notifications/history" }],
            ["notification send", { method: "POST", url: "/api/v1/admin/notifications/send", payload: {
                title: "Notice",
                body: "Test",
                targetType: "all",
            } }],
            ["invoice list", { method: "GET", url: "/api/v1/admin/invoices" }],
            ["invoice detail", { method: "GET", url: "/api/v1/admin/invoices/65fa29c9d2c1f2e165fa29c9" }],
            ["invoice create", { method: "POST", url: "/api/v1/admin/invoices", payload: {} }],
            ["invoice status update", { method: "PATCH", url: "/api/v1/admin/invoices/65fa29c9d2c1f2e165fa29c9/status", payload: { status: "paid" } }],
            ["chat list", { method: "GET", url: "/api/v1/admin/chat/list" }],
            ["ad status update", { method: "PATCH", url: "/api/v1/admin/ads/65fa29c9d2c1f2e165fa29c9/status", payload: { status: "approved" } }],
            ["admin user delete", { method: "DELETE", url: "/api/v1/admin/admin-users/65fa29c9d2c1f2e165fa29c9" }],
        ] as const;

        const responses = await Promise.all(checks.map(async ([label, options]) => ({
            label,
            response: await inject(app, options as InjectOptions),
        })));

        responses.forEach(({ label, response: res }: { label: string; response: InjectResponse }) => {
            expect({ label, status: res.statusCode }).toEqual({ label, status: 401 });
            expect(res.json()).toEqual(
                expect.objectContaining({
                    success: false,
                })
            );
        });
    });

    it("keeps the canonical public admin auth alias mounted", async () => {
        const response = await inject(app, {
            method: "POST",
            url: "/api/v1/admin/auth/login",
            payload: {
                email: "",
                password: "",
            },
        });
        expect(response.statusCode).not.toBe(404);
    });
});
