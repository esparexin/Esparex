'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import logger from '@/lib/logger';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        logger.error('[Admin] Route error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
                    <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                        <span className="text-display">⚠️</span>
                    </div>
                    <p className="text-caption font-bold uppercase tracking-widest text-destructive mb-2">Error</p>
                    <h1 className="text-h2 font-bold text-foreground mb-3">Something went wrong</h1>
                    <p className="text-foreground-tertiary text-body mb-8">
                        An unexpected error occurred in the Esparex Admin Console.
                        {error.digest && (
                            <span className="block mt-2 text-caption text-foreground-subtle font-mono">
                                Error ID: {error.digest}
                            </span>
                        )}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={reset}
                            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-body font-semibold px-6 py-3 rounded-xl shadow-sm transition-colors"
                        >
                            Try Again
                        </button>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center justify-center gap-2 bg-card hover:bg-accent text-foreground-secondary text-body font-semibold px-6 py-3 rounded-xl border border-border transition-colors"
                        >
                            ← Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
