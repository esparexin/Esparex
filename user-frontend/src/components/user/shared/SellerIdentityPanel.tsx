"use client";

import type { ReactNode } from "react";
import Link from "next/link";

type SellerIdentityPanelProps = {
    name: string;
    avatar: ReactNode;
    badge?: ReactNode;
    subtitle?: ReactNode;
    meta?: ReactNode;
    trailing?: ReactNode;
    className?: string;
    href?: string | null;
    onClick?: () => void;
};

const BASE_CLASS =
    "flex items-start gap-3 w-full text-left rounded-lg p-2 transition-colors";

export function SellerIdentityPanel({
    name,
    avatar,
    badge,
    subtitle,
    meta,
    trailing,
    className,
    href,
    onClick,
}: SellerIdentityPanelProps) {
    const content = (
        <>
            {avatar}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold truncate">{name}</h3>
                    {badge}
                </div>
                {subtitle}
                {meta}
            </div>
            {trailing}
        </>
    );

    if (href) {
        return (
            <Link href={href} className={`${BASE_CLASS} ${className || ""}`}>
                {content}
            </Link>
        );
    }

    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={`${BASE_CLASS} ${className || ""}`}>
                {content}
            </button>
        );
    }

    return <div className={`${BASE_CLASS} ${className || ""}`}>{content}</div>;
}
