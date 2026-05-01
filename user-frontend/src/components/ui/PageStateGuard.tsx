import React from 'react';

export type PageState = 'loading' | 'error' | 'empty' | 'ready';

interface PageStateGuardProps {
    state: PageState;
    loading: React.ReactNode;
    empty: React.ReactNode;
    error: React.ReactNode;
    children: React.ReactNode;
}

/**
 * PageStateGuard ensures that exactly ONE primary state is visible at a time.
 * It prevents the overlapping of loading skeletons, empty states, and ready content.
 */
export function PageStateGuard({
    state,
    loading,
    empty,
    error,
    children,
}: PageStateGuardProps) {
    switch (state) {
        case 'loading':
            return <>{loading}</>;
        case 'error':
            return <>{error}</>;
        case 'empty':
            return <>{empty}</>;
        case 'ready':
            return <>{children}</>;
        default:
            const unreachableState: never = state;
            throw new Error(`Unhandled page state: ${unreachableState}`);
    }
}
