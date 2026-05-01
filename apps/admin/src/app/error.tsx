'use client';

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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
                    <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2">Error</p>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h1>
                    <p className="text-gray-500 text-sm mb-8">
                        An unexpected error occurred in this section of the admin panel.
                        {error.digest && (
                            <span className="block mt-2 text-xs text-gray-400 font-mono">
                                Ref: {error.digest}
                            </span>
                        )}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={reset}
                            className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
                        >
                            Try Again
                        </button>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-6 py-3 rounded-xl border border-gray-200 transition-colors"
                        >
                            ← Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
