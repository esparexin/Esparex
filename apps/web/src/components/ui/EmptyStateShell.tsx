import React from 'react';

interface EmptyStateShellProps {
    children: React.ReactNode;
}

/**
 * EmptyStateShell - Governance-compliant empty state component
 * 
 * Rules:
 * - Text content only
 * - No icons
 * - No buttons
 * - No custom styling beyond basic centering
 */
export function EmptyStateShell({ children }: EmptyStateShellProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {children}
        </div>
    );
}
