"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    MoreVertical,
    type LucideIcon,
} from "@esparex/ui";

export type ActionMenuItem = {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    variant?: "default" | "danger" | "warning";
    disabled?: boolean;
};

export type AdminActionMenuProps = {
    items: ActionMenuItem[];
    align?: "start" | "center" | "end";
    ariaLabel?: string;
    className?: string;
};

const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

export function AdminActionMenu({
    items,
    align = "end",
    ariaLabel = "Row actions menu",
    className,
}: AdminActionMenuProps) {
    if (items.length === 0) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-foreground-secondary shadow-xs transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                    className
                )}
                aria-label={ariaLabel}
            >
                <MoreVertical size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="w-44 rounded-xl p-1 shadow-lg">
                {items.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <DropdownMenuItem
                            key={index}
                            onClick={item.onClick}
                            disabled={item.disabled}
                            variant={item.variant === "danger" ? "destructive" : "default"}
                            className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium cursor-pointer rounded-lg"
                        >
                            {Icon && <Icon size={14} className="shrink-0" />}
                            <span>{item.label}</span>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
