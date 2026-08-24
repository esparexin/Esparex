import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@esparex/ui";
import { WifiOff, Home } from "lucide-react";
import { OfflineReloadButton } from "@/components/common/OfflineReloadButton";

export const metadata: Metadata = {
    title: "You're offline | Esparex",
    robots: { index: false, follow: false },
};

export default function OfflinePage() {
    return (
        <main
            className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-muted text-foreground"
            // design-token-ignore: offline fallback page must inline system font in case CSS bundle fails
            style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
            <style>{`
                svg { max-width: 32px !important; max-height: 32px !important; flex-shrink: 0 !important; }
            `}</style>
            <Card
                className="w-full max-w-sm mx-auto bg-background border border-border/80 rounded-2xl shadow-xl p-8 sm:p-10 text-center transition-all"
            >
                {/* Icon Badge with explicit width/height constraints */}
                <div
                    className="mb-6 mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 shadow-2xs"
                >
                    <WifiOff
                        className="size-8 text-amber-600 dark:text-amber-400 shrink-0"
                        width={32}
                        height={32}
                        aria-hidden="true"
                    />
                </div>

                {/* Main Heading */}
                <h1 className="mb-2.5 text-h3 sm:text-h2 font-bold tracking-tight text-foreground">
                    You&apos;re offline
                </h1>

                {/* Subtitle */}
                <p className="mb-8 text-body leading-relaxed text-foreground-secondary max-w-xs mx-auto">
                    It looks like you&apos;ve lost your internet connection. Check your network connection and try again.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                    <OfflineReloadButton />
                    <Link
                        href="/"
                        className="w-full sm:w-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background hover:bg-muted px-6 text-body font-semibold text-foreground-secondary transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        // design-token-ignore: offline fallback page must inline system font in case CSS bundle fails
                        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
                    >
                        <Home className="h-4 w-4 shrink-0" width={16} height={16} />
                        <span>Go to homepage</span>
                    </Link>
                </div>
            </Card>
        </main>
    );
}

