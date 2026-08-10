import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff, Home } from "lucide-react";
import { OfflineReloadButton } from "@/components/common/OfflineReloadButton";

export const metadata: Metadata = {
    title: "You're offline | Esparex",
    robots: { index: false, follow: false },
};

export default function OfflinePage() {
    return (
        <main
            className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
            <style>{`
                svg { max-width: 32px !important; max-height: 32px !important; flex-shrink: 0 !important; }
            `}</style>
            <div
                className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xl p-8 sm:p-10 text-center transition-all"
                style={{ maxWidth: "480px" }}
            >
                {/* Icon Badge with explicit width/height constraints */}
                <div
                    className="mb-6 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 shadow-2xs"
                    style={{ width: "64px", height: "64px", maxWidth: "64px", maxHeight: "64px" }}
                >
                    <WifiOff
                        className="h-8 w-8 text-amber-600 dark:text-amber-400 shrink-0"
                        width={32}
                        height={32}
                        style={{ width: "32px", height: "32px", maxWidth: "32px", maxHeight: "32px" }}
                        aria-hidden="true"
                    />
                </div>

                {/* Main Heading */}
                <h1 className="mb-2.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    You&apos;re offline
                </h1>

                {/* Subtitle */}
                <p className="mb-8 text-sm leading-relaxed text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
                    It looks like you&apos;ve lost your internet connection. Check your network connection and try again.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                    <OfflineReloadButton />
                    <Link
                        href="/"
                        className="w-full sm:w-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 px-6 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
                    >
                        <Home className="h-4 w-4 shrink-0" width={16} height={16} />
                        <span>Go to homepage</span>
                    </Link>
                </div>
            </div>
        </main>
    );
}
