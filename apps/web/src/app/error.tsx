'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, Button, AlertTriangle, Home, RefreshCcw, Mail } from '@esparex/ui';

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
                <Card className="rounded-3xl border border-border bg-card/90 p-6 text-center shadow-xl backdrop-blur-xl sm:p-8">
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
                        <h1 className="text-h3 sm:text-h2 font-bold text-foreground">
                            Something Went Wrong
                        </h1>
                        <p className="mx-auto max-w-xs text-body text-muted-foreground leading-relaxed">
                            We hit a temporary bump while loading this page. Don&apos;t worry, your account and data are safe.
                        </p>
                    </div>

                    {/* Developer Error Details (Collapsible) */}
                    {process.env.NODE_ENV === 'development' && (
                        <details className="mt-4 text-left rounded-xl border border-rose-200/60 bg-rose-50/50 p-3 text-caption">
                            <summary className="cursor-pointer font-bold text-rose-900 select-none">
                                View Error Details
                            </summary>
                            <p className="mt-2 font-mono text-tiny text-rose-700 break-all">
                                {safeMessage}
                            </p>
                            {error.digest && (
                                <p className="mt-1 text-tiny text-rose-600">
                                    Digest: {error.digest}
                                </p>
                            )}
                        </details>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-6 flex flex-row items-center justify-center gap-2.5">
                        <Button
                            type="button"
                            variant="primary"
                            onClick={reset}
                            className="flex-1 min-h-[44px] rounded-xl text-body font-semibold"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            <span>Try Again</span>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="flex-1 min-h-[44px] rounded-xl text-body font-semibold"
                        >
                            <Link href="/">
                                <Home className="h-4 w-4 text-foreground-subtle" />
                                <span>Homepage</span>
                            </Link>
                        </Button>
                    </div>

                    {/* Secondary Help Link */}
                    <div className="mt-5 border-t border-border pt-4">
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-1.5 text-caption font-semibold text-muted-foreground transition-colors hover:text-primary"
                        >
                            <Mail className="h-3.5 w-3.5" />
                            <span>Contact Support</span>
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}

