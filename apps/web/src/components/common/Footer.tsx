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
                <Image src="/icons/logo.png" alt="Esparex" width={512} height={206} style={{ height: '32px', width: 'auto' }} />
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
                {/* Main Single Responsive Footer Content Grid */}
                <div className="grid grid-cols-1 min-[460px]:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-4 md:mb-6">
                    {/* Brand Block */}
                    <div className="col-span-1 min-[460px]:col-span-2 md:col-span-1 space-y-4 text-left">
                        {renderBrandBlock()}
                    </div>

                    {/* Link Sections */}
                    {FOOTER_LINK_SECTIONS.map((section) => (
                        <div
                            key={section.title}
                            className={cn(
                                "col-span-1 rounded-2xl border md:border-0 p-4 md:p-0 text-left",
                                isDark ? "border-slate-800 bg-slate-900/60 md:bg-transparent" : "border-slate-200 bg-white md:bg-transparent"
                            )}
                        >
                            <h3 className={cn("mb-2 md:mb-4 font-semibold uppercase tracking-wider text-xs", isDark ? "text-foreground-subtle" : "text-foreground")}>
                                {section.title}
                            </h3>
                            <ul className="space-y-1.5 md:space-y-2">
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
                <div className={cn("flex flex-col items-start justify-between gap-3 pt-4 md:flex-row md:items-center md:gap-4 md:pt-4 border-t", isDark ? "border-slate-900" : "border-slate-200")}>
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
                </div>
            </div>
        </footer>
    );
}
