import * as React from 'react';
import { cn } from './utils';

export type PageContainerVariant = 'compact' | 'default' | 'wide' | 'full';

export interface PageContainerProps extends React.ComponentProps<'div'> {
    variant?: PageContainerVariant;
}

const variantStyles: Record<PageContainerVariant, string> = {
    compact: 'max-w-xl mx-auto space-y-3 px-4 md:px-0',
    default: 'max-w-3xl mx-auto space-y-3 px-4 md:px-0',
    wide: 'max-w-7xl mx-auto space-y-3 px-4 md:px-6 lg:px-8',
    full: 'w-full space-y-3 px-4 md:px-6',
};

/**
 * Canonical PageContainer primitive (Layer 3 Foundation Primitive)
 * Enforces standardized container reading measures and margins across viewports.
 */
export function PageContainer({
    variant = 'default',
    className,
    children,
    ...props
}: PageContainerProps) {
    return (
        <div
            data-slot="page-container"
            data-variant={variant}
            className={cn(variantStyles[variant], className)}
            {...props}
        >
            {children}
        </div>
    );
}
