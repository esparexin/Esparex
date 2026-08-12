"use client";

import { EmptyState, type EmptyStateProps, Inbox } from "@esparex/ui";

export type AdminEmptyStateProps = Partial<EmptyStateProps> & {
    title?: string;
};

export function AdminEmptyState({
    title = "No records found",
    description = "No items matched your current filters or criteria.",
    icon = Inbox,
    className,
    ...props
}: AdminEmptyStateProps) {
    return (
        <EmptyState
            title={title}
            description={description}
            icon={icon}
            className={className}
            {...props}
        />
    );
}
