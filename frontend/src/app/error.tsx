'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCcw, Mail } from 'lucide-react';
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
        "We encountered an unexpected error. Please try again."
    );

    useEffect(() => {
        // Log the error to an error reporting service
        logger.error('Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-2xl w-full text-center">
                {/* Error Illustration */}
                <div className="mb-8">
                    <div className="relative">
                        <h1 className="text-9xl font-bold text-red-500 opacity-10">500</h1>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white rounded-full p-8 shadow-xl">
                                <AlertTriangle className="text-red-500" size={80} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                <h2 className="text-4xl font-bold text-slate-900 mb-4">
                    Oops! Something Went Wrong
                </h2>
                <p className="text-xl text-slate-600 mb-8">
                    We encountered an unexpected error. Don't worry, our team has been notified and we're working on it.
                </p>

                {/* Error Details (in development) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-left">
                        <h3 className="font-semibold text-red-900 mb-2">Error Details:</h3>
                        <p className="text-sm text-red-700 font-mono break-all">
                            {safeMessage}
                        </p>
                        {error.digest && (
                            <p className="text-sm text-red-600 mt-2">
                                Error ID: {error.digest}
                            </p>
                        )}
                    </div>
                )}

                {/* What Happened */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h3 className="text-lg font-semibold mb-4">What Happened?</h3>
                    <p className="text-slate-700 mb-4">
                        The application encountered an unexpected error while processing your request.
                        This could be due to a temporary issue or a bug in our system.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900">
                            <strong>Don't worry!</strong> Your data is safe, and this error has been automatically
                            reported to our technical team. We'll investigate and fix it as soon as possible.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg transition-colors font-semibold"
                    >
                        <RefreshCcw size={20} />
                        <span>Try Again</span>
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-slate-800 px-8 py-3 rounded-lg transition-colors font-semibold border-2 border-gray-300"
                    >
                        <Home size={20} />
                        <span>Go to Homepage</span>
                    </Link>
                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-slate-800 px-8 py-3 rounded-lg transition-colors font-semibold"
                    >
                        <Mail size={20} />
                        <span>Contact Support</span>
                    </Link>
                </div>

                {/* Help Section */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="font-semibold text-yellow-900 mb-3">
                        Still Having Issues?
                    </h3>
                    <p className="text-sm text-yellow-800 mb-4">
                        If this problem persists, please contact our support team with the following information:
                    </p>
                    <ul className="text-left text-sm text-yellow-800 space-y-2 max-w-md mx-auto">
                        <li className="flex items-start gap-2">
                            <span>•</span>
                            <span>What you were trying to do when the error occurred</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span>•</span>
                            <span>The page URL where you encountered the error</span>
                        </li>
                        {error.digest && (
                            <li className="flex items-start gap-2">
                                <span>•</span>
                                <span>Error ID: <code className="bg-yellow-100 px-1 rounded">{error.digest}</code></span>
                            </li>
                        )}
                        <li className="flex items-start gap-2">
                            <span>•</span>
                            <span>Your browser and device information</span>
                        </li>
                    </ul>
                    <div className="mt-4">
                        <Link
                            href="/contact"
                            className="text-sm text-primary hover:text-primary-dark font-semibold hover:underline"
                        >
                            Contact Support →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
