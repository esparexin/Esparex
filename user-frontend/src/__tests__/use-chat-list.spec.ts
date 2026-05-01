import { describe, expect, it } from "vitest";

import { mergeRefreshedConversations } from "@/hooks/useChatList";
import type { IConversationDTO } from "@shared/contracts/chat.contracts";

const conversation = (id: string, updatedAt: string): IConversationDTO => ({
    id,
    ad: {
        id: `ad-${id}`,
        title: `Listing ${id}`,
    },
    buyer: {
        id: `buyer-${id}`,
        name: `Buyer ${id}`,
    },
    seller: {
        id: `seller-${id}`,
        name: `Seller ${id}`,
    },
    unreadBuyer: 0,
    unreadSeller: 0,
    isBlocked: false,
    isAdClosed: false,
    createdAt: updatedAt,
    updatedAt,
    lastMessageAt: updatedAt,
});

describe("mergeRefreshedConversations", () => {
    it("keeps already-loaded older conversations when page one refreshes", () => {
        const existing = [
            conversation("a", "2026-03-28T09:00:00.000Z"),
            conversation("b", "2026-03-28T08:00:00.000Z"),
            conversation("c", "2026-03-28T07:00:00.000Z"),
            conversation("d", "2026-03-28T06:00:00.000Z"),
        ];

        const refreshed = [
            conversation("b", "2026-03-28T10:00:00.000Z"),
            conversation("e", "2026-03-28T09:30:00.000Z"),
            conversation("a", "2026-03-28T09:00:00.000Z"),
        ];

        expect(mergeRefreshedConversations(existing, refreshed).map((item) => item.id)).toEqual([
            "b",
            "e",
            "a",
            "c",
            "d",
        ]);
    });

    it("does not duplicate conversations that already exist in the loaded tail", () => {
        const existing = [
            conversation("x", "2026-03-28T09:00:00.000Z"),
            conversation("y", "2026-03-28T08:00:00.000Z"),
        ];

        const refreshed = [
            conversation("y", "2026-03-28T10:00:00.000Z"),
            conversation("x", "2026-03-28T09:00:00.000Z"),
        ];

        expect(mergeRefreshedConversations(existing, refreshed).map((item) => item.id)).toEqual([
            "y",
            "x",
        ]);
    });
});
