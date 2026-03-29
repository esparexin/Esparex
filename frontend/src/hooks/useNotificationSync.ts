"use client";

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { queryKeys } from "@/hooks/queries/queryKeys";

import { API_V1_BASE_PATH, DEFAULT_LOCAL_API_ORIGIN } from '@/lib/api/routes';
import { resolveBrowserApiBaseUrl } from '@/lib/api/browserApiBase';

interface InboxUpdatedPayload {
    userId: string;
    version: number;
    delta: number;
}

interface UseNotificationSyncOptions {
    /** Only connect when the user is authenticated */
    enabled?: boolean;
}

// Derive the socket server origin from the API URL env var.
// The API lives at http://host:port/api/v1 — socket.io is at http://host:port
const SOCKET_ORIGIN = (() => {
    const apiUrl = resolveBrowserApiBaseUrl(
        process.env.NEXT_PUBLIC_API_URL ?? `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`
    );
    try {
        const u = new URL(apiUrl);
        return `${u.protocol}//${u.host}`;
    } catch {
        return 'http://localhost:5001';
    }
})();

/**
 * 🔌 Central Notification Synchronisation Hook
 *
 * Maintains a single socket.io connection per authenticated session.
 * On `inbox_updated` the notification query cache is invalidated so the
 * bell badge and inbox page both refresh without any HTTP polling.
 *
 * Version guard: duplicate broadcast bursts (same or older version) are
 * silently dropped. A 200 ms debounce coalesces rapid-fire updates into
 * a single React Query invalidation.
 */
export const useNotificationSync = ({ enabled = true }: UseNotificationSyncOptions = {}) => {
    const queryClient = useQueryClient();
    const socketRef = useRef<Socket | null>(null);
    const localVersion = useRef<number>(0);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        // Reuse an existing connection if the hook is remounted (e.g. HMR)
        if (!socketRef.current) {
            socketRef.current = io(SOCKET_ORIGIN, {
                // Send cookies automatically so the server auth middleware
                // can validate the user without an explicit token.
                withCredentials: true,
                // We start with polling and upgrade to websocket for maximum compatibility
                // behind various browser/proxy configurations and to avoid initial handshake errors.
                transports: ['polling', 'websocket'],
                // Reconnection strategy: back off up to 10 s
                reconnectionDelay: 1000,
                reconnectionDelayMax: 10_000,
                reconnectionAttempts: Infinity,
                // Only connect when this effect runs, not at import time
                autoConnect: false,
            });
        }

        const socket = socketRef.current;

        const handleInboxUpdated = (payload: InboxUpdatedPayload) => {
            // Ignore stale or duplicate broadcasts
            if (payload.version <= localVersion.current) return;
            localVersion.current = payload.version;

            // Debounce: coalesce burst alerts into one invalidation
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
            }, 200);
        };

        socket.on('inbox_updated', handleInboxUpdated);

        if (!socket.connected) {
            socket.connect();
        }

        return () => {
            socket.off('inbox_updated', handleInboxUpdated);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            // Disconnect when the component tree is fully unmounted
            // (not on every re-render — the socket is reused while the
            //  user is logged in)
        };
    }, [enabled, queryClient]);

    // Disconnect on logout (enabled flips to false)
    useEffect(() => {
        if (!enabled && socketRef.current?.connected) {
            socketRef.current.disconnect();
            socketRef.current = null;
            localVersion.current = 0;
        }
    }, [enabled]);
};
