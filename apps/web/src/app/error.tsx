'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCcw, Mail } from '@esparex/ui';

import { mapErrorToMessage } from "@/lib/errorMapper";
import logger from "@/lib/logger";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const safeMessage = mapErrorToMessage(
        error,
        "We encountered an unexpected issue. Please try again."
    );

    useEffect(() => {
        logger.error('Error:', error);
    }, [error]);

    return (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 min-h-[calc(100vh-12rem)] w-full">
            <div className="w-full max-w-md transition-all">
                <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 text-center shadow-xl backdrop-blur-xl sm:p-8">
                    {/* Compact Icon */}
                    <div className="mb-5 flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-2xl bg-rose-100 blur-lg opacity-60" />
                            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 shadow-sm">
                                <AlertTriangle className="h-8 w-8" strokeWidth={2} />
                            </div>
                        </div>
                    </div>

                    {/* Badge & Title */}
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/60 bg-rose-50 px-3 py-1 text-tiny font-bold uppercase tracking-wider text-rose-700">
                            500 · Server Error
                        </div>
                        <h1 className="text-xl font-extrabold text-foreground sm:text-2xl">
                            Something Went Wrong
                        </h1>
                        <p className="mx-auto max-w-xs text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            We hit a temporary bump while loading this page. Don&apos;t worry, your account and data are safe.
                        </p>
                    </div>

                    {/* Developer Error Details (Collapsible) */}
                    {process.env.NODE_ENV === 'development' && (
                        <details className="mt-4 text-left rounded-xl border border-rose-200/60 bg-rose-50/50 p-3 text-xs">
                            <summary className="cursor-pointer font-bold text-rose-900 select-none">
                                View Error Details
                            </summary>
                            <p className="mt-2 font-mono text-tiny text-rose-700 break-all">
                                {safeMessage}
                            </p>
                            {error.digest && (
                                <p className="mt-1 text-2xs text-rose-600">
                                    Digest: {error.digest}
                                </p>
                            )}
                        </details>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-6 flex flex-row items-center justify-center gap-2.5">
                        <button
                            type="button"
                            onClick={reset}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 sm:text-sm"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            <span>Try Again</span>
                        </button>
                        <Link
                            href="/"
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-foreground-secondary shadow-sm transition-all hover:bg-slate-50 active:scale-95 sm:text-sm"
                        >
                            <Home className="h-4 w-4 text-slate-500" />
                            <span>Homepage</span>
                        </Link>
                    </div>

                    {/* Secondary Help Link */}
                    <div className="mt-5 border-t border-slate-100 pt-4">
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-blue-600"
                        >
                            <Mail className="h-3.5 w-3.5" />
                            <span>Contact Support</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
