"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Badge,
    Button,
    Card,
    CardContent,
    Container,
    Calendar,
    Check,
    ChevronRight,
    LayoutGrid,
    MapPin,
    Share2,
    ShieldCheck,
} from "@esparex/ui";
import { AdCardGrid } from "@/components/user/ad-card";
import { type UserListing as Ad } from "@/lib/api/user/listings";
import type { SellerProfilePayload } from "@/lib/api/user/users";
import { formatStableDate } from "@/lib/formatters";
import { LocationFacade } from "@esparex/shared";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";
import { SafeImage } from "@/components/common/SafeImage";

interface SellerProfilePageProps {
    profile: SellerProfilePayload;
}

const buildAdHref = (ad: Ad): string => {
    return buildPublicListingDetailRoute({
        id: ad.id,
        listingType: ad.listingType,
        seoSlug: ad.seoSlug,
        title: ad.title,
    });
};

export function SellerProfilePage({ profile }: SellerProfilePageProps) {
    const [copied, setCopied] = useState(false);

    const sellerName = profile.user.name || "Seller";
    const joinDate = profile.user.createdAt ? formatStableDate(profile.user.createdAt) : "N/A";
    const initials = sellerName.trim().charAt(0).toUpperCase() || "S";
    const locationLabel = LocationFacade.format(profile.user.location);
    const ads = profile.ads || [];

    const handleShare = async () => {
        const url = typeof window !== "undefined" ? window.location.href : "";
        if (!url) return;
        try {
            if (navigator.share) {
                await navigator.share({ title: `${sellerName} on Esparex`, url });
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className="bg-background pb-12 min-h-screen">
            <Container variant="lg" className="py-3 md:py-6 space-y-3 md:space-y-4">
                {/* Breadcrumbs */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-caption text-foreground-subtle overflow-x-auto scrollbar-hide py-0.5">
                    <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                    <ChevronRight className="size-3 text-muted-foreground" />
                    <span className="text-foreground-secondary font-medium">Sellers</span>
                    <ChevronRight className="size-3 text-muted-foreground" />
                    <span className="text-foreground font-semibold truncate max-w-[200px]">{sellerName}</span>
                </nav>

                {/* Profile Identity Card */}
                <Card className="relative border border-border shadow-sm overflow-hidden rounded-2xl md:rounded-3xl bg-card">
                    {/* Share Profile Icon Button in Top Right */}
                    <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10">
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            onClick={handleShare}
                            aria-label={copied ? "Link copied to clipboard" : "Share seller profile"}
                            title={copied ? "Link copied!" : "Share Profile"}
                            className="size-8 sm:size-[34px] rounded-full bg-card/85 backdrop-blur-md border border-border/80 text-foreground hover:bg-card hover:text-primary transition-colors shadow-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            {copied ? <Check className="size-3.5 text-primary" /> : <Share2 className="size-3.5" />}
                        </Button>
                    </div>

                    {/* Soft Brand Header Canvas */}
                    <div className="relative h-20 sm:h-28 w-full bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15 dark:from-primary/20 dark:to-muted border-b border-primary/10 overflow-hidden">
                        <div className="absolute inset-0 opacity-20 text-primary bg-[radial-gradient(currentColor_1px,transparent_1px)] [background-size:16px_16px]" />
                        <div className="absolute -top-10 -right-10 size-48 bg-primary/15 rounded-full blur-2xl pointer-events-none" />
                    </div>

                    <CardContent className="pt-0 px-3.5 sm:px-5 pb-3.5 sm:pb-4">
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 -mt-8 sm:-mt-10 relative">
                            {/* Avatar with Trust Badge on Top-Right Side */}
                            <div className="shrink-0 mx-auto sm:mx-0">
                                <div className="relative inline-block">
                                    <div className="size-16 sm:size-20 rounded-2xl bg-card p-1 shadow-md ring-3 ring-card border border-border/80 overflow-hidden flex items-center justify-center">
                                        {profile.user.profilePhoto ? (
                                            <div className="relative size-full rounded-xl overflow-hidden">
                                                <SafeImage src={profile.user.profilePhoto} alt={sellerName} fill className="object-cover" sizes="80px" />
                                            </div>
                                        ) : (
                                            <div className="size-full rounded-xl bg-primary/10 text-primary flex items-center justify-center text-body-lg sm:text-h3 font-bold">
                                                {initials}
                                            </div>
                                        )}
                                    </div>
                                    {profile.user.isVerified && (
                                        <div
                                            className="absolute -top-1 -right-1 z-10 size-5 sm:size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm ring-2 ring-card"
                                            title="Verified Seller"
                                            aria-label="Verified Seller"
                                        >
                                            <ShieldCheck className="size-3 sm:size-3.5" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Seller Details */}
                            <div className="flex-1 min-w-0 pt-1 text-center sm:text-left">
                                <h1 className="text-body-lg sm:text-h3 font-bold text-foreground tracking-tight leading-snug break-words mb-0.5">
                                    {sellerName}
                                </h1>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-tiny sm:text-caption text-foreground-secondary font-medium mt-1">
                                    <span className="inline-flex items-center gap-1">
                                        <Calendar className="size-3 sm:size-3.5 text-foreground-subtle" /> Active since {joinDate}
                                    </span>
                                    {locationLabel && (
                                        <span className="inline-flex items-center gap-1">
                                            <MapPin className="size-3 sm:size-3.5 text-foreground-subtle" /> {locationLabel}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Seller's Listings Showcase */}
                <section id="seller-active-listings" className="space-y-3 pt-1">
                    <div className="flex items-center justify-between border-b border-border pb-2.5">
                        <div className="flex items-center gap-2">
                            <h2 className="text-body sm:text-body-lg font-semibold text-foreground tracking-tight">Active Listings</h2>
                            <Badge className="bg-muted text-foreground-secondary font-medium px-2 py-0.5 rounded-full text-tiny border-none">{ads.length}</Badge>
                        </div>
                    </div>

                    {ads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2.5 py-10 sm:py-14 text-center rounded-2xl border border-border bg-card shadow-sm">
                            <div className="size-10 sm:size-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground"><LayoutGrid className="size-5 sm:size-6" /></div>
                            <div className="space-y-0.5">
                                <p className="font-semibold text-foreground text-body-lg">No active listings</p>
                                <p className="text-caption text-foreground-secondary max-w-xs">{sellerName} does not have any active listings right now.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
                            {ads.map((ad, index) => (
                                <AdCardGrid
                                    key={String(ad.id)}
                                    ad={ad}
                                    href={buildAdHref(ad)}
                                    priority={index < 4}
                                    responsiveCompactList
                                />
                            ))}
                        </div>
                    )}
                </section>
            </Container>
        </div>
    );
}

