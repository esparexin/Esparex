import React from 'react';

/**
 * EmptyStateShell - Governance-compliant empty state wrapper
 */
export function EmptyStateShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            {children}
        </div>
    );
}
