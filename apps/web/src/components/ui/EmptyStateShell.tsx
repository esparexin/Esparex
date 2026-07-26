import React from 'react';
import { cn } from './utils';

export interface AccountEmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    cta?: React.ReactNode;
    className?: string;
}

/**
 * Canonical AccountEmptyState primitive (Layer 3 Foundation Primitive)
 * Rules:
 * - 40px/48px icon
 * - 15px/16px semibold title
 * - 13px description text
 * - Single primary/secondary CTA
 */
export function AccountEmptyState({
    icon,
    title,
    description,
    cta,
    className,
}: AccountEmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-10 px-4 text-center", className)}>
            {icon && (
                <div className="mb-3 text-slate-400 flex justify-center [&>svg]:h-10 [&>svg]:w-10 md:[&>svg]:h-12 md:[&>svg]:w-12">
                    {icon}
                </div>
            )}
            <h3 className="account-section-title mb-1">{title}</h3>
            <p className="account-body-text max-w-xs mb-5">{description}</p>
            {cta}
        </div>
    );
}

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
