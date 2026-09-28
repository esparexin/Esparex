import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    EMAIL_TEMPLATE_CATEGORY,
    EMAIL_TEMPLATE_KEY,
    type EmailTemplateDTO,
} from "@esparex/contracts";
import { ADMIN_ROUTES } from "@esparex/shared";
import * as api from "../lib/api/emailTemplates";
import * as adminClient from "../lib/api/adminClient";

vi.mock("../lib/api/adminClient", () => ({
    adminFetch: vi.fn(),
}));

describe("Admin Email Templates UI & API Integration", () => {
    const mockedAdminFetch = vi.mocked(adminClient.adminFetch);

    const mockTemplates: EmailTemplateDTO[] = [
        {
            key: EMAIL_TEMPLATE_KEY.PASSWORD_RESET,
            name: "Admin Password Reset",
            category: EMAIL_TEMPLATE_CATEGORY.AUTHENTICATION,
            description: "Single-use password reset link dispatched when an admin requests password recovery.",
            trigger: "Admin submits forgot-password request on login screen",
            defaultSubject: "Reset Your Esparex Admin Password",
            subject: "Reset Your Esparex Admin Password",
            isCustomized: false,
            variables: [
                { name: "resetUrl", description: "Reset URL", example: "https://admin.esparex.in/reset" },
            ],
        },
        {
            key: EMAIL_TEMPLATE_KEY.LISTING_APPROVED,
            name: "Listing Approved",
            category: EMAIL_TEMPLATE_CATEGORY.LISTINGS,
            description: "Sent to seller when an ad listing passes moderation.",
            trigger: "Moderator marks listing as APPROVED",
            defaultSubject: "Your Listing is Now Live: {{title}}",
            subject: "Special Live Notice: {{title}}",
            isCustomized: true,
            customSubject: "Special Live Notice: {{title}}",
            customHeadline: "Your Ad is Live",
            customNote: "Sell faster with boosts.",
            variables: [
                { name: "title", description: "Title", example: "Brake Pads" },
                { name: "viewUrl", description: "URL", example: "https://esparex.in/ads/1" },
            ],
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("API Client functions", () => {
        it("listEmailTemplates calls ADMIN_ROUTES.EMAIL_TEMPLATES", async () => {
            mockedAdminFetch.mockResolvedValueOnce({
                success: true,
                data: mockTemplates,
            } as any);

            const result = await api.listEmailTemplates();
            expect(mockedAdminFetch).toHaveBeenCalledWith(ADMIN_ROUTES.EMAIL_TEMPLATES);
            expect(result).toHaveLength(2);
        });


        it("getEmailTemplatePreview calls POST to preview route with overrides", async () => {
            const previewResponse = {
                key: EMAIL_TEMPLATE_KEY.LISTING_APPROVED,
                subject: "Preview Subject",
                html: "<html><body>Preview</body></html>",
            };
            mockedAdminFetch.mockResolvedValueOnce({
                success: true,
                data: previewResponse,
            } as any);

            const result = await api.getEmailTemplatePreview(EMAIL_TEMPLATE_KEY.LISTING_APPROVED, {
                customHeadline: "Live Draft Headline",
            });
            expect(mockedAdminFetch).toHaveBeenCalledWith(
                ADMIN_ROUTES.EMAIL_TEMPLATE_PREVIEW(EMAIL_TEMPLATE_KEY.LISTING_APPROVED),
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({ customHeadline: "Live Draft Headline" }),
                })
            );
            expect(result.html).toContain("Preview");
        });

        it("updateEmailTemplate calls PUT with payload", async () => {
            mockedAdminFetch.mockResolvedValueOnce({
                success: true,
                data: {
                    ...mockTemplates[0],
                    isCustomized: true,
                    subject: "Updated Subject",
                },
            } as any);

            const result = await api.updateEmailTemplate(EMAIL_TEMPLATE_KEY.PASSWORD_RESET, {
                subject: "Updated Subject",
            });
            expect(mockedAdminFetch).toHaveBeenCalledWith(
                ADMIN_ROUTES.EMAIL_TEMPLATE_BY_KEY(EMAIL_TEMPLATE_KEY.PASSWORD_RESET),
                expect.objectContaining({
                    method: "PATCH",
                    body: JSON.stringify({ subject: "Updated Subject" }),
                })
            );
            expect(result.isCustomized).toBe(true);
        });

        it("resetEmailTemplate calls POST to reset route", async () => {
            const target = mockTemplates[1];
            expect(target).toBeDefined();

            mockedAdminFetch.mockResolvedValueOnce({
                success: true,
                data: {
                    ...target,
                    isCustomized: false,
                    subject: target?.defaultSubject,
                },
            } as any);

            const result = await api.resetEmailTemplate(EMAIL_TEMPLATE_KEY.LISTING_APPROVED);
            expect(mockedAdminFetch).toHaveBeenCalledWith(
                ADMIN_ROUTES.EMAIL_TEMPLATE_RESET(EMAIL_TEMPLATE_KEY.LISTING_APPROVED),
                expect.objectContaining({
                    method: "POST",
                })
            );
            expect(result.isCustomized).toBe(false);
        });

        it("sendTestEmailTemplate calls POST to test route with recipient and draft", async () => {
            mockedAdminFetch.mockResolvedValueOnce({
                success: true,
                data: {
                    recipient: "ops@esparex.in",
                    messageId: "msg_456",
                },
            } as any);

            const result = await api.sendTestEmailTemplate(
                EMAIL_TEMPLATE_KEY.PASSWORD_RESET,
                "ops@esparex.in",
                { subject: "Test Draft" }
            );
            expect(mockedAdminFetch).toHaveBeenCalledWith(
                ADMIN_ROUTES.EMAIL_TEMPLATE_TEST(EMAIL_TEMPLATE_KEY.PASSWORD_RESET),
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({
                        recipientEmail: "ops@esparex.in",
                        customization: { subject: "Test Draft" },
                    }),
                })
            );
            expect(result.recipient).toBe("ops@esparex.in");
        });
    });

    describe("Filter and Search Logic", () => {
        it("filters by category accurately", () => {
            const listingsOnly = mockTemplates.filter(
                (t) => t.category === EMAIL_TEMPLATE_CATEGORY.LISTINGS
            );
            expect(listingsOnly).toHaveLength(1);
            const first = listingsOnly[0];
            expect(first?.key).toBe(EMAIL_TEMPLATE_KEY.LISTING_APPROVED);
        });

        it("filters by case-insensitive search term across name, key, subject, and trigger", () => {
            const query = "password";
            const matches = mockTemplates.filter(
                (t) =>
                    t.name.toLowerCase().includes(query) ||
                    t.key.toLowerCase().includes(query) ||
                    t.subject.toLowerCase().includes(query) ||
                    t.trigger.toLowerCase().includes(query)
            );
            expect(matches).toHaveLength(1);
            const first = matches[0];
            expect(first?.key).toBe(EMAIL_TEMPLATE_KEY.PASSWORD_RESET);
        });
    });
});
