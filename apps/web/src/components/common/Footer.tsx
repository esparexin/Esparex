"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "../ui/badge";
import {
    CheckCircle,
} from "@/icons/IconRegistry";
import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";
import { cn } from "@/lib/utils";

interface FooterProps {
    theme?: "light" | "dark";
    onNavigate?: (page: string) => void;
    className?: string;
    currentYear: number;
}

type FooterLinkSection = {
    title: string;
    links: Array<{
        label: string;
        href: string;
        pageKey: string;
    }>;
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

export function Footer({ theme = "light", onNavigate, className, currentYear }: FooterProps) {
    const pathname = usePathname();
    const hasMobileBottomNav = getMobileChromePolicy(pathname).showMobileBottomNav;

    // Hide footer on Post Ad wizard to prevent sticky CTA conflicts
    if (pathname === "/post-ad" || pathname?.startsWith("/edit-ad") || pathname === "/post-service" || pathname === "/account/business/apply") return null;

    const isDark = theme === "dark";

    const renderLink = (label: string, href: string, pageKey: string, compact = false) => {
        const baseClassName = cn(
            compact
                ? "inline-flex items-center text-xs md:text-sm transition-colors"
                : "inline-flex min-h-10 items-center text-left text-xs md:text-sm transition-colors md:min-h-0",
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
                title={label}
                className={baseClassName}
            >
                {label}
            </Link>
        );
    };

    const renderBrandBlock = () => (
        <div className="text-left">
            <Link href="/" className="inline-block">
                <Image src="/icons/logo.png" alt="Esparex" width={470} height={112} style={{ height: '32px', width: 'auto' }} />
            </Link>
        </div>
    );

    return (
        <footer
            className={cn(
                "mt-auto w-full border-t",
                hasMobileBottomNav
                    ? "pt-4 pb-[calc(4rem+env(safe-area-inset-bottom))] md:py-6"
                    : "py-4 md:py-6",
                isDark ? "bg-slate-950 border-slate-900 text-foreground-subtle" : "bg-slate-50 border-slate-200 text-foreground-tertiary",
                className
            )}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Mobile Single-Line Footer Links */}
                <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs text-foreground-tertiary md:hidden mb-3">
                    {FOOTER_LINK_SECTIONS.flatMap((section) => section.links).map((link, idx, arr) => (
                        <div key={link.label} className="inline-flex items-center gap-2.5">
                            {renderLink(link.label, link.href, link.pageKey, true)}
                            {idx < arr.length - 1 && <span className="text-slate-300 select-none">•</span>}
                        </div>
                    ))}
                </div>

                {/* Main Desktop Footer Content Grid */}
                <div className="hidden md:grid md:grid-cols-4 gap-6 mb-6">
                    {/* Brand Block */}
                    <div className="col-span-1 space-y-4 text-left">
                        {renderBrandBlock()}
                    </div>

                    {/* Link Sections */}
                    {FOOTER_LINK_SECTIONS.map((section) => (
                        <div
                            key={section.title}
                            className="col-span-1 text-left"
                        >
                            <h3 className={cn("mb-4 font-bold uppercase tracking-wider text-xs", isDark ? "text-foreground-subtle" : "text-foreground")}>
                                {section.title}
                            </h3>
                            <ul className="space-y-2">
                                {section.links.map((link) => (
                                    <li key={link.label} className="leading-5">
                                        {renderLink(link.label, link.href, link.pageKey, true)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className={cn("flex flex-col items-start justify-between gap-2.5 pt-3 md:flex-row md:items-center md:gap-4 md:pt-4 border-t", isDark ? "border-slate-900" : "border-slate-200")}>
                    <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-4">
                        <Badge className={cn(
                            "border px-2.5 py-0.5 text-tiny md:text-xs",
                            isDark ? "bg-slate-900 text-primary border-slate-800" : "bg-green-50 text-green-700 border-green-100"
                        )}>
                            <CheckCircle className="h-3 w-3 mr-1.5" />
                            Verified Safe Marketplace
                        </Badge>
                        <span className="text-tiny md:text-xs font-normal text-muted-foreground">
                            © {currentYear} Esparex Platform. Built for the future of tech repair.
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
