'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import logger from "@/lib/logger";

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
        <html>
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

                <style dangerouslySetInnerHTML={{
                    __html: `
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
              'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          }

          .bg-gray-50 {
            background-color: #f9fafb;
          }

          .bg-white {
            background-color: #ffffff;
          }

          .text-foreground {
            color: #111827;
          }

          .text-foreground-tertiary {
            color: #4b5563;
          }

          .text-muted-foreground {
            color: #6b7280;
          }

          .text-foreground-secondary {
            color: #1f2937;
          }

          .text-red-500 {
            color: #ef4444;
          }

          .bg-primary {
            background-color: #16a34a;
          }

          .bg-primary:hover {
            background-color: #15803d;
          }

          .text-white {
            color: #ffffff;
          }

          .rounded-full {
            border-radius: 9999px;
          }

          .rounded-lg {
            border-radius: 0.5rem;
          }

          .shadow-xl {
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
          }

          .inline-flex {
            display: inline-flex;
          }

          .items-center {
            align-items: center;
          }

          .justify-center {
            justify-content: center;
          }

          .gap-2 {
            gap: 0.5rem;
          }

          .gap-4 {
            gap: 1rem;
          }

          .px-4 {
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .px-8 {
            padding-left: 2rem;
            padding-right: 2rem;
          }

          .py-3 {
            padding-top: 0.75rem;
            padding-bottom: 0.75rem;
          }

          .p-8 {
            padding: 2rem;
          }

          .mb-4 {
            margin-bottom: 1rem;
          }

          .mb-8 {
            margin-bottom: 2rem;
          }

          .mt-8 {
            margin-top: 2rem;
          }

          .min-h-screen {
            min-height: 100vh;
          }

          .flex {
            display: flex;
          }

          .flex-col {
            flex-direction: column;
          }

          .text-center {
            text-align: center;
          }

          .text-4xl {
            font-size: 2.25rem;
          }

          .text-xl {
            font-size: 1.25rem;
          }

          .text-sm {
            font-size: 0.875rem;
          }

          .font-bold {
            font-weight: 700;
          }

          .font-semibold {
            font-weight: 600;
          }

          .max-w-2xl {
            max-width: 42rem;
          }

          .w-full {
            width: 100%;
          }

          .inline-block {
            display: inline-block;
          }

          .border-2 {
            border-width: 2px;
          }

          .border-gray-300 {
            border-color: #d1d5db;
          }

          .transition-colors {
            transition-property: color, background-color, border-color;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            transition-duration: 150ms;
          }

          a {
            text-decoration: none;
          }

          button {
            border: none;
            cursor: pointer;
            font-family: inherit;
          }

          @media (min-width: 640px) {
            .sm\\:flex-row {
              flex-direction: row;
            }
          }
        `}} />            </body>
        </html>
    );
}
