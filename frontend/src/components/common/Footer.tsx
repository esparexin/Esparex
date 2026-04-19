"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import {
    MailOpen,
    MapPin,
    Phone,
    CheckCircle,
} from "@/icons/IconRegistry";
import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";
import { cn } from "@/lib/utils";

interface FooterProps {
    theme?: "light" | "dark";
    onNavigate?: (page: string) => void;
    className?: string;
}

type FooterLinkSection = {
    title: string;
    links: Array<{
        label: string;
        href: string;
        pageKey: string;
    }>;
};

type FooterContactItem = {
    title: string;
    value: string;
    icon: ComponentType<{ className?: string }>;
};

const FOOTER_LINK_SECTIONS: FooterLinkSection[] = [
    {
        title: "Company",
        links: [
            { label: "About Us", href: "/about", pageKey: "about" },
            { label: "Contact", href: "/contact", pageKey: "contact" },
        ],
    },
    {
        title: "Support",
        links: [
            { label: "Help Center", href: "/faq", pageKey: "faq" },
            { label: "Safety Tips", href: "/safety-tips", pageKey: "safety-tips" },
            { label: "How It Works", href: "/how-it-works", pageKey: "how-it-works" },
        ],
    },
    {
        title: "Legal",
        links: [
            { label: "Terms of Service", href: "/terms", pageKey: "terms" },
            { label: "Privacy Policy", href: "/privacy", pageKey: "privacy" },
        ],
    },
];

const FOOTER_BRAND_ACTIONS = [
    { label: "Contact", href: "/contact", icon: MapPin },
    { label: "Help", href: "/faq", icon: Phone },
    { label: "Email", href: "mailto:support@esparex.com", icon: MailOpen },
] as const;

export function Footer({ theme = "light", onNavigate, className }: FooterProps) {
    const pathname = usePathname();
    const currentYear = new Date().getFullYear();
    const hasMobileBottomNav = getMobileChromePolicy(pathname).showMobileBottomNav;

    // Hide footer on Post Ad wizard to prevent sticky CTA conflicts
    if (pathname === "/post-ad" || pathname?.startsWith("/edit-ad") || pathname === "/post-service" || pathname === "/account/business/apply") return null;

    const isDark = theme === "dark";

    const renderLink = (label: string, href: string, pageKey: string, compact = false) => {
        const baseClassName = cn(
            compact
                ? "inline-flex items-center text-sm transition-colors"
                : "inline-flex min-h-10 items-center text-left text-sm transition-colors md:min-h-0",
            isDark ? "hover:text-primary text-foreground-subtle" : "hover:text-green-600 text-foreground-tertiary"
        );

        if (onNavigate) {
            return (
                <button
                    onClick={() => onNavigate(pageKey)}
                    className={cn(baseClassName, compact && "text-left")}
                >
                    {label}
                </button>
            );
        }
        return (
            <Link
                href={href}
                prefetch={false}
                className={baseClassName}
            >
                {label}
            </Link>
        );
    };

    const renderBrandBlock = (compact = false) => (
        <div className="space-y-3 text-left">
            <div className="flex items-center gap-3 justify-start">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/icons/logo.png" alt="Esparex" width={512} height={206} style={{ height: '32px', width: 'auto' }} />
                </Link>
            </div>
            <p className={cn("text-sm leading-relaxed", isDark ? "text-muted-foreground" : "text-muted-foreground")}>
                India's premium privacy-first marketplace for device spare parts and services.
            </p>
            <div className="flex flex-row items-center gap-2 justify-start">
                {FOOTER_BRAND_ACTIONS.map(({ label, href, icon: Icon }) => {
                    const classes = cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
                        isDark
                            ? "border-slate-800 bg-slate-900/70 text-foreground-subtle hover:border-primary/30 hover:text-white"
                            : "border-slate-200 bg-white text-foreground-tertiary hover:border-green-200 hover:text-green-700"
                    );

                    if (href.startsWith("mailto:")) {
                        return (
                            <a key={label} href={href} className={classes}>
                                <Icon className="h-4 w-4 shrink-0" />
                                <span>{label}</span>
                            </a>
                        );
                    }

                    return (
                        <Link key={label} href={href} className={classes} prefetch={false}>
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </div>
            {!compact && (
                <p className={cn("text-xs uppercase tracking-[0.2em] font-bold", isDark ? "text-foreground-tertiary" : "text-foreground-subtle")}>
                    India's Leading Spare Parts Exchange
                </p>
            )}
        </div>
    );

    return (
        <footer
            className={cn(
                "mt-auto w-full border-t",
                hasMobileBottomNav
                    ? "pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:py-12"
                    : "py-6 md:py-12",
                isDark ? "bg-slate-950 border-slate-900 text-foreground-subtle" : "bg-slate-50 border-slate-200 text-foreground-tertiary",
                className
            )}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="md:hidden mb-6 space-y-5">
                    {renderBrandBlock(true)}

                    <div className="grid grid-cols-2 gap-4 min-[460px]:grid-cols-3">
                        {FOOTER_LINK_SECTIONS.map((section) => (
                            <div
                                key={section.title}
                                className={cn(
                                    "min-w-0 rounded-2xl border p-4 text-left",
                                    isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white"
                                )}
                            >
                                <p className={cn("text-xs font-semibold uppercase tracking-[0.16em]", isDark ? "text-foreground-subtle" : "text-muted-foreground")}>
                                    {section.title}
                                </p>
                                <ul className="mt-3 space-y-2">
                                    {section.links.map((link) => (
                                        <li key={link.label} className="leading-5">
                                            {renderLink(link.label, link.href, link.pageKey, true)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Footer Content */}
                <div className="hidden md:grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4 md:gap-10 mb-6 md:mb-10">
                    {/* Brand & Social */}
                    <div className="col-span-1 space-y-4 text-left sm:col-span-2 md:col-span-1 md:order-first">
                        {renderBrandBlock()}
                    </div>

                    {FOOTER_LINK_SECTIONS.map((section) => (
                        <div key={section.title} className="col-span-1 text-left">
                            <h3 className={cn("mb-2 md:mb-4 font-semibold uppercase tracking-wider text-2xs md:text-xs", isDark ? "text-foreground-subtle" : "text-foreground")}>
                                {section.title}
                            </h3>
                            <ul className="space-y-0.5 md:space-y-2">
                                {section.links.map((link) => (
                                    <li key={link.label}>{renderLink(link.label, link.href, link.pageKey)}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>



                {/* Bottom Bar */}
                <div className={cn("flex flex-col items-start justify-between gap-4 pt-6 md:flex-row md:items-center md:gap-6 md:pt-8 border-t", isDark ? "border-slate-900" : "border-slate-200")}>
                    <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:gap-4">
                        <Badge className={cn(
                            "border px-3 py-1",
                            isDark ? "bg-slate-900 text-primary border-slate-800" : "bg-green-50 text-green-700 border-green-100"
                        )}>
                            <CheckCircle className="h-3 w-3 mr-1.5" />
                            Verified Safe Marketplace
                        </Badge>
                        <span className="text-xs font-medium">
                            © {currentYear} Esparex Platform. Built for the future of tech repair.
                        </span>
                    </div>
                    <p className={cn("text-left text-2xs uppercase tracking-[0.2em] font-bold", isDark ? "text-foreground-tertiary" : "text-foreground-subtle")}>
                        India's Leading Spare Parts Exchange
                    </p>
                </div>
            </div>
        </footer>
    );
}
