import {
    adminListQuerySchema,
    sendMessageSchema,
    chatUploadUrlSchema,
    ALLOWED_CHAT_MIME_TYPES,
} from "@esparex/core/validators/chat.validator";

describe("chat.validator", () => {
    const validConversationId = "507f1f77bcf86cd799439011";

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

    describe("sendMessageSchema MIME-type enforcement (VAL-02)", () => {
        it("accepts all canonical allowed chat MIME types", () => {
            for (const mimeType of ALLOWED_CHAT_MIME_TYPES) {
                const result = sendMessageSchema.safeParse({
                    conversationId: validConversationId,
                    text: "Here is an attachment",
                    attachments: [
                        {
                            url: "https://example.com/file.jpg",
                            mimeType,
                            size: 1024 * 1024,
                            name: "test-file",
                        },
                    ],
                });
                expect(result.success).toBe(true);
            }
        });

        it("rejects unauthorized or executable MIME types", () => {
            const dangerousTypes = [
                "application/x-msdownload",
                "text/html",
                "application/javascript",
                "image/svg+xml",
                "application/octet-stream",
                "",
            ];

            for (const mimeType of dangerousTypes) {
                const result = sendMessageSchema.safeParse({
                    conversationId: validConversationId,
                    text: "Dangerous payload",
                    attachments: [
                        {
                            url: "https://example.com/payload",
                            mimeType,
                            size: 1024,
                        },
                    ],
                });
                expect(result.success).toBe(false);
            }
        });
    });

    describe("chatUploadUrlSchema MIME validation", () => {
        it("accepts valid media content types", () => {
            const result = chatUploadUrlSchema.safeParse({
                conversationId: validConversationId,
                contentType: "image/jpeg; charset=utf-8",
                filename: "photo.jpg",
            });
            expect(result.success).toBe(true);
        });

        it("rejects unsupported content types", () => {
            const result = chatUploadUrlSchema.safeParse({
                conversationId: validConversationId,
                contentType: "application/x-sh",
            });
            expect(result.success).toBe(false);
        });
    });
});

