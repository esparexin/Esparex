"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { resolveRuntimeApiOrigin } from "@/lib/api/runtimeApiBase";
import { CHAT_INBOX_UPDATED_EVENT } from "@/lib/chatEvents";

interface InboxUpdatedPayload {
    userId: string;
    version: number;
    delta: number;
}

interface UseRealtimeSyncOptions {
    enabled?: boolean;
}

const SOCKET_ORIGIN = (() => {
    return resolveRuntimeApiOrigin();
})();

/**
 * 🔌 Unified Realtime Synchronization Hook
 *
 * Maintains a single socket.io connection per authenticated session.
 * It synchronizes both notifications and chat lists:
 * 1. Invalidates notification query cache on socket events.
 * 2. Dispatches CHAT_INBOX_UPDATED_EVENT to trigger chat lists update.
 */
export const useRealtimeSync = ({ enabled = true }: UseRealtimeSyncOptions = {}) => {
    const queryClient = useQueryClient();
    const socketRef = useRef<Socket | null>(null);
    const localVersion = useRef<number>(0);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!enabled || typeof window === "undefined") return undefined;

        if (!socketRef.current) {
            socketRef.current = io(SOCKET_ORIGIN, {
                withCredentials: true,
                transports: ["polling", "websocket"],
                reconnectionDelay: 1000,
                reconnectionDelayMax: 10000,
                reconnectionAttempts: Infinity,
                autoConnect: false,
            });
        }

        const socket = socketRef.current;

        const handleInboxUpdated = (payload: InboxUpdatedPayload) => {
            if (payload.version <= localVersion.current) return;
            localVersion.current = payload.version;

            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                // Invalidate notifications cache
                void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

                // Dispatch chat updates event to refresh active chat pools
                if (typeof window !== "undefined") {
                    const event = new CustomEvent(CHAT_INBOX_UPDATED_EVENT);
                    window.dispatchEvent(event);
                }
            }, 200);
        };

        socket.on("inbox_updated", handleInboxUpdated);

        if (!socket.connected) {
            socket.connect();
        }

        return () => {
            socket.off("inbox_updated", handleInboxUpdated);
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [enabled, queryClient]);

    useEffect(() => {
        if (!enabled && socketRef.current?.connected) {
            socketRef.current.disconnect();
            socketRef.current = null;
            localVersion.current = 0;
        }
    }, [enabled]);
};
