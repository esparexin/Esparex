import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// STUB: Replace with actual socket.io client import once socket gateway is exposed to Next.js
export const socket = {
    on: (event: string, callback: any) => {
        if (typeof window !== 'undefined') {
            window.addEventListener(`ws_${event}`, (e: any) => callback(e.detail));
        }
    },
    off: (event: string, callback: any) => {
        if (typeof window !== 'undefined') {
            window.removeEventListener(`ws_${event}`, callback);
        }
    }
};

interface UseNotificationSyncOptions {
    enabled?: boolean;
}

/**
 * 🚀 Central Notification Synchronization Hook
 * 
 * Replaces aggressive legacy HTTP polling with passive WebSocket observation.
 * Intelligently drops duplicate broadcast versions and batches updates via 200ms debounce.
 */
export const useNotificationSync = ({ enabled = true }: UseNotificationSyncOptions = {}) => {
    const queryClient = useQueryClient();
    const localVersion = useRef<number>(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const handleInboxUpdate = (payload: { userId: string, version: number, delta: number }) => {
            // Compare serverVersion vs localVersion stringently
            if (payload.version <= localVersion.current) return;
            
            localVersion.current = payload.version;

            // Debounce refresh (200ms) to guard against burst alert spam
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
            }, 200);
        };

        socket.on('inbox_updated', handleInboxUpdate);
        
        return () => {
            socket.off('inbox_updated', handleInboxUpdate);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [enabled, queryClient]);
};
