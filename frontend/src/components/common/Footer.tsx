"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import {
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    MailOpen,
    MapPin,
    Phone,
    CheckCircle,
} from "@/icons/IconRegistry";
import { cn } from "@/lib/utils";

interface FooterProps {
    theme?: "light" | "dark";
    onNavigate?: (page: string) => void;
    className?: string;
}

export function Footer({ theme = "light", onNavigate, className }: FooterProps) {
    const pathname = usePathname();
    const currentYear = new Date().getFullYear();

    // Hide footer on Post Ad wizard to prevent sticky CTA conflicts
    if (pathname === "/post-ad" || pathname?.startsWith("/edit-ad") || pathname === "/post-service" || pathname === "/account/business/apply") return null;

    const isDark = theme === "dark";

    const renderLink = (label: string, href: string, pageKey: string) => {
        if (onNavigate) {
            return (
                <button
                    onClick={() => onNavigate(pageKey)}
                    className={cn(
                        "transition-colors text-left",
                        isDark ? "hover:text-primary text-slate-400" : "hover:text-green-600 text-slate-600"
                    )}
                >
                    {label}
                </button>
            );
        }
        return (
            <Link
                href={href}
                prefetch={false}
                className={cn(
                    "transition-colors",
                    isDark ? "hover:text-primary text-slate-400" : "hover:text-green-600 text-slate-600"
                )}
            >
                {label}
            </Link>
        );
    };

    return (
        <footer
            className={cn(
                "py-12 border-t mt-auto w-full",
                isDark ? "bg-slate-950 border-slate-900 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600",
                className
            )}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Footer Content */}
                <div className="grid grid-cols-3 md:grid-cols-4 gap-8 md:gap-10 mb-10">
                    {/* Brand & Social */}
                    <div className="space-y-4 text-center md:text-left col-span-3 md:col-span-1 order-last md:order-first">
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">E</div>
                                <span className={cn("text-xl font-bold tracking-tight", isDark ? "text-white" : "text-green-600")}>Esparex</span>
                            </Link>
                        </div>
                        <p className={cn("text-sm leading-relaxed", isDark ? "text-slate-500" : "text-slate-500")}>
                            India's premium privacy-first marketplace for device spare parts and services.
                        </p>
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                <button
                                    key={i}
                                    className={cn(
                                        "transition-colors",
                                        isDark ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-green-600"
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Company Links */}
                    <div className="text-center md:text-left col-span-1">
                        <h3 className={cn("mb-4 font-semibold uppercase tracking-wider text-xs", isDark ? "text-slate-300" : "text-slate-900")}>Company</h3>
                        <ul className="space-y-2 text-sm">
                            <li>{renderLink("About Us", "/about", "about")}</li>
                            <li>{renderLink("Contact", "/contact", "contact")}</li>
                            <li>{renderLink("Careers", "/faq", "faq")}</li>
                            <li>{renderLink("Press", "/about", "about")}</li>
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div className="text-center md:text-left col-span-1">
                        <h3 className={cn("mb-4 font-semibold uppercase tracking-wider text-xs", isDark ? "text-slate-300" : "text-slate-900")}>Support</h3>
                        <ul className="space-y-2 text-sm">
                            <li>{renderLink("Help Center", "/faq", "faq")}</li>
                            <li>{renderLink("Safety Tips", "/safety-tips", "safety-tips")}</li>
                            <li>{renderLink("Posting Rules", "/safety-tips", "safety-tips")}</li>
                            <li>{renderLink("How It Works", "/how-it-works", "how-it-works")}</li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div className="text-center md:text-left col-span-1">
                        <h3 className={cn("mb-4 font-semibold uppercase tracking-wider text-xs", isDark ? "text-slate-300" : "text-slate-900")}>Legal</h3>
                        <ul className="space-y-2 text-sm">
                            <li>{renderLink("Terms of Service", "/terms", "terms")}</li>
                            <li>{renderLink("Privacy Policy", "/privacy", "privacy")}</li>
                            <li>{renderLink("Cookie Policy", "/privacy", "privacy")}</li>
                            <li>{renderLink("Refund Policy", "/terms", "terms")}</li>
                        </ul>
                    </div>
                </div>

                <Separator className={cn("mb-8", isDark ? "bg-slate-900" : "bg-slate-200")} />

                {/* Contact Info Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border transition-all group",
                        isDark ? "bg-slate-900/50 border-slate-800/50 hover:border-primary/20" : "bg-white border-slate-100 hover:border-green-200"
                    )}>
                        <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                            isDark ? "bg-slate-800 text-primary group-hover:bg-primary group-hover:text-white" : "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white"
                        )}>
                            <MailOpen className="h-5 w-5" />
                        </div>
                        <div>
                            <div className={cn("text-xs font-bold uppercase tracking-wider mb-0.5", isDark ? "text-white" : "text-slate-900")}>Email Support</div>
                            <div className="text-sm">support@esparex.com</div>
                        </div>
                    </div>

                    <div className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border transition-all group",
                        isDark ? "bg-slate-900/50 border-slate-800/50 hover:border-primary/20" : "bg-white border-slate-100 hover:border-green-200"
                    )}>
                        <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                            isDark ? "bg-slate-800 text-primary group-hover:bg-primary group-hover:text-white" : "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white"
                        )}>
                            <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                            <div className={cn("text-xs font-bold uppercase tracking-wider mb-0.5", isDark ? "text-white" : "text-slate-900")}>Headquarters</div>
                            <div className="text-sm">Hyderabad, Telangana</div>
                        </div>
                    </div>

                    <div className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border transition-all group",
                        isDark ? "bg-slate-900/50 border-slate-800/50 hover:border-primary/20" : "bg-white border-slate-100 hover:border-green-200"
                    )}>
                        <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                            isDark ? "bg-slate-800 text-primary group-hover:bg-primary group-hover:text-white" : "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white"
                        )}>
                            <Phone className="h-5 w-5" />
                        </div>
                        <div>
                            <div className={cn("text-xs font-bold uppercase tracking-wider mb-0.5", isDark ? "text-white" : "text-slate-900")}>Support Hours</div>
                            <div className="text-sm">Mon–Sat, 9 AM – 7 PM</div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className={cn("flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t", isDark ? "border-slate-900" : "border-slate-200")}>
                    <div className="flex flex-col md:flex-row items-center gap-4">
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
                    <p className={cn("text-[10px] uppercase tracking-[0.2em] font-bold", isDark ? "text-slate-600" : "text-slate-400")}>
                        India's Leading Spare Parts Exchange
                    </p>
                </div>
            </div>
        </footer>
    );
}
