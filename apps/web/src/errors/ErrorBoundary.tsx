"use client";

import React, { Component, ReactNode } from "react";
import { logError } from "./errorLogger";
import { ErrorFallback } from "./ErrorFallback";
import { normalizeApiError } from "./normalizeApiError";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        // Determine fallback UI appearance on next render
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Format generic boundaries down to normalized class
        const appError = normalizeApiError(error);

        // Attach stack details securely onto the error.details JSON
        const mergedDetails = typeof appError.details === "object" && appError.details !== null
            ? { ...appError.details, componentStack: errorInfo.componentStack }
            : { originalDetails: appError.details, componentStack: errorInfo.componentStack };

        appError.details = mergedDetails;

        // Send the strictly formatted object to logging
        logError(appError);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    override render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return <ErrorFallback error={this.state.error!} resetErrorBoundary={this.handleReset} />;
        }

        return this.props.children;
    }
}
