"use client";

import { RotateCw } from "lucide-react";
import { useState } from "react";

export function OfflineReloadButton() {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleReload = () => {
        setIsRefreshing(true);
        window.location.reload();
    };

    return (
        <button
            type="button"
            onClick={handleReload}
            disabled={isRefreshing}
            className="w-full sm:w-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 px-6 text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-75 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
            <RotateCw className={`h-4 w-4 shrink-0 ${isRefreshing ? "animate-spin" : ""}`} width={16} height={16} />
            <span>{isRefreshing ? "Checking connection…" : "Try again"}</span>
        </button>
    );
}
