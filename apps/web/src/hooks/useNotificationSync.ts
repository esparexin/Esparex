"use client";

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from "@/hooks/queries/queryKeys";
import { getChatSocket, disconnectChatSocket } from '@/lib/chatSocket';

interface InboxUpdatedPayload {
    userId: string;
    version: number;
    delta: number;
}

interface UseNotificationSyncOptions {
    /** Only connect when the user is authenticated */
    enabled?: boolean;
}

/**
 * 🔌 Central Notification Synchronisation Hook
 *
 * Reuses the single-instance Socket.IO connection.
 * On `inbox_updated` the notification query cache is invalidated so the
 * bell badge and inbox page both refresh without any HTTP polling.
 */
export const useNotificationSync = ({ enabled = true }: UseNotificationSyncOptions = {}) => {
    const queryClient = useQueryClient();
    const localVersion = useRef<number>(0);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return undefined;

        const socket = getChatSocket();
        if (!socket) return undefined;

        const handleInboxUpdated = (payload: InboxUpdatedPayload) => {
            if (payload?.version && payload.version <= localVersion.current) return;
            if (payload?.version) localVersion.current = payload.version;

            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
            }, 200);
        };

        socket.on('inbox_updated', handleInboxUpdated);

        return () => {
            socket.off('inbox_updated', handleInboxUpdated);
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [enabled, queryClient]);

    // Disconnect on logout (enabled flips to false)
    useEffect(() => {
        if (!enabled) {
            disconnectChatSocket();
            localVersion.current = 0;
        }
    }, [enabled]);
};

