'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import logger from "@/lib/logger";
import '@/styles/globals.css';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        logger.error('Global Error:', error);
    }, [error]);

    return (
        <html lang="en">
            <body>
                <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-8">
                    <div className="w-full max-w-md transition-all">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl sm:p-8">
                            {/* Icon */}
                            <div className="mb-5 flex justify-center">
                                <div className="relative">
                                    <div className="absolute inset-0 rounded-2xl bg-rose-100 blur-lg opacity-60" />
                                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 shadow-sm">
                                        <AlertTriangle className="h-8 w-8" strokeWidth={2} />
                                    </div>
                                </div>
                            </div>

                            {/* Title & Message */}
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/60 bg-rose-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-700">
                                    500 · System Error
                                </div>
                                <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                                    Critical System Error
                                </h1>
                                <p className="mx-auto max-w-xs text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    An unexpected system error occurred. Please refresh or try returning to homepage.
                                </p>
                            </div>

                            {/* Buttons */}
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
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 sm:text-sm"
                                >
                                    <Home className="h-4 w-4 text-slate-500" />
                                    <span>Homepage</span>
                                </Link>
                            </div>

                            {error.digest ? (
                                <p className="mt-5 text-[10px] text-slate-400">
                                    Error ID: {error.digest}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}

