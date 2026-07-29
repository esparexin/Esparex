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
                <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                    <div className="max-w-2xl w-full text-center">
                        {/* Error Illustration */}
                        <div className="mb-8">
                            <div className="bg-white rounded-full p-8 shadow-xl inline-block">
                                <AlertTriangle className="text-red-500" size={80} />
                            </div>
                        </div>

                        {/* Error Message */}
                        <h1 className="text-4xl font-bold text-foreground mb-4">
                            Critical Error
                        </h1>
                        <p className="text-xl text-foreground-tertiary mb-8">
                            A critical error occurred. Please try refreshing the page.
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={reset}
                                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg transition-colors font-semibold"
                            >
                                <RefreshCcw size={20} />
                                <span>Try Again</span>
                            </button>
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-foreground-secondary px-8 py-3 rounded-lg transition-colors font-semibold border-2 border-gray-300"
                            >
                                <Home size={20} />
                                <span>Go to Homepage</span>
                            </Link>
                        </div>

                        {/* Error ID */}
                        {error.digest && (
                            <p className="text-sm text-muted-foreground mt-8">
                                Error ID: {error.digest}
                            </p>
                        )}
                    </div>
                </div>
            </body>
        </html>
    );
}

