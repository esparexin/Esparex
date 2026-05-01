"use client";

import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Z_INDEX } from '@/lib/zIndexConfig';

interface ConnectivityBannerProps {
    apiUnavailable?: boolean;
}

export const ConnectivityBanner: React.FC<ConnectivityBannerProps> = ({ apiUnavailable }) => {
    const isOnline = useOnlineStatus();
    const isOffline = !isOnline;

    // Show banner if actually offline (Red) or system confirmed failure (Amber)
    const showBanner = isOffline || apiUnavailable;
    if (!showBanner) return null;

    return (
        <div style={{ zIndex: Z_INDEX.connectivityBanner }} className={`w-full py-2 px-4 flex items-center justify-center gap-2 transition-all duration-300 sticky top-0 shadow-md
      ${isOffline ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>

            {isOffline ? (
                <>
                    <WifiOff size={18} />
                    <span className="text-sm font-medium">You’re offline. Check your internet connection.</span>
                </>
            ) : (
                <>
                    <AlertTriangle size={18} />
                    <span className="text-sm font-medium">Server unreachable. Some features may not work.</span>
                </>
            )}
        </div>
    );
};
