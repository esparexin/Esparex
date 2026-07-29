'use client';
/* eslint-disable no-console */

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log to console in dev; Sentry picks it up automatically in production
        console.error('[Admin] Route error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="bg-card rounded-2xl shadow-sm border border-border p-10">
                    <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2">Error</p>
                    <h1 className="text-2xl font-bold text-foreground mb-3">Something went wrong</h1>
                    <p className="text-foreground-tertiary text-sm mb-8">
                        An unexpected error occurred in the Esparex Admin Console.
                        {error.digest && (
                            <span className="block mt-2 text-xs text-foreground-subtle font-mono">
                                Error ID: {error.digest}
                            </span>
                        )}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={reset}
                            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-6 py-3 rounded-xl shadow-xs transition-colors"
                        >
                            Try Again
                        </button>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center justify-center gap-2 bg-card hover:bg-accent text-foreground-secondary text-sm font-semibold px-6 py-3 rounded-xl border border-border transition-colors"
                        >
                            ← Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
