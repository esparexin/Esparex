import { normalizeAuthCallbackUrl } from "@/lib/authHelpers";

export const CHAT_INBOX_ROUTE = "/account/messages";
export type ChatInboxView = "active" | "archived";

export const resolveChatInboxView = (rawView?: string | string[] | null): ChatInboxView => {
    const candidate = Array.isArray(rawView) ? rawView[0] : rawView;
    return candidate === "archived" ? "archived" : "active";
};

export const buildChatInboxRoute = (view: ChatInboxView = "active"): string =>
    view === "archived" ? `${CHAT_INBOX_ROUTE}?view=archived` : CHAT_INBOX_ROUTE;

export const buildChatConversationRoute = (
    conversationId: string,
    options?: {
        view?: ChatInboxView;
        returnTo?: string | null;
    }
): string => {
    const basePath = `${CHAT_INBOX_ROUTE}/${encodeURIComponent(String(conversationId))}`;
    const params = new URLSearchParams();
    const view = options?.view;
    const returnTo = options?.returnTo;

    if (view === "archived") {
        params.set("view", "archived");
    }

    if (returnTo) {
        const normalizedReturnTo = normalizeAuthCallbackUrl(returnTo);
        if (
            normalizedReturnTo !== "/" &&
            normalizedReturnTo !== CHAT_INBOX_ROUTE &&
            normalizedReturnTo !== basePath
        ) {
            params.set("returnTo", normalizedReturnTo);
        }
    }

    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
};

export const resolveChatReturnTo = (
    rawReturnTo?: string | null,
    fallback: string = CHAT_INBOX_ROUTE
): string => {
    const normalized = normalizeAuthCallbackUrl(rawReturnTo);
    if (normalized === "/") {
        return fallback;
    }
    return normalized;
};
