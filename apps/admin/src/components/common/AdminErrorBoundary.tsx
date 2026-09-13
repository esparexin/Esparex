"use client";
/* eslint-disable no-console */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "@esparex/ui";

interface Props {
    children: ReactNode;
    fallbackLabel?: string;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class AdminErrorBoundary extends Component<Props, State> {
    public override state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Admin UI Error caught by boundary:", error, errorInfo);
    }

    public override render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/50 p-8 text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">
                        {this.props.fallbackLabel || "Component Rendering Failed"}
                    </h3>
                    <p className="max-w-md text-sm text-foreground-secondary">
                        A runtime error occurred while rendering this module. Our team has been notified.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="mt-6 rounded-lg bg-foreground px-4 py-2 text-body font-medium text-background transition-colors hover:bg-foreground/90 cursor-pointer"
                    >
                        Try Again
                    </button>
                    {process.env.NODE_ENV !== "production" && (
                        <pre className="mt-4 max-w-full overflow-auto rounded bg-foreground text-background p-4 text-left text-tiny text-destructive-foreground">
                            {this.state.error?.message}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
