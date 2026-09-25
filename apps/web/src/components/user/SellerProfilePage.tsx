"use client";

import { useState, useMemo } from "react";
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
    Search,
    Share2,
    ShieldCheck,
    Tag,
    X,
} from "@esparex/ui";
import { AdCardGrid } from "@/components/user/ad-card";
import { type Listing as Ad } from "@/lib/api/user/listings";
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
    const [searchFilter, setSearchFilter] = useState("");
    const [copied, setCopied] = useState(false);

    const sellerName = profile.user.name || "Seller";
    const joinDate = profile.user.createdAt ? formatStableDate(profile.user.createdAt) : "N/A";
    const initials = sellerName.trim().charAt(0).toUpperCase() || "S";
    const locationLabel = LocationFacade.format(profile.user.location);
    const totalActive = profile.ads?.length || 0;

    const filteredAds = useMemo(() => {
        if (!searchFilter.trim()) return profile.ads || [];
        const query = searchFilter.toLowerCase().trim();
        return (profile.ads || []).filter((ad) =>
            ad.title?.toLowerCase().includes(query) || ad.category?.toLowerCase().includes(query)
        );
    }, [profile.ads, searchFilter]);

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
            <Container variant="lg" className="py-4 md:py-6 space-y-4">
                {/* Breadcrumbs */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-caption text-foreground-subtle">
                    <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                    <ChevronRight className="size-3 text-muted-foreground" />
                    <span className="text-foreground-secondary font-medium">Sellers</span>
                    <ChevronRight className="size-3 text-muted-foreground" />
                    <span className="text-foreground font-semibold truncate max-w-[200px]">{sellerName}</span>
                </nav>

                {/* Profile Identity Card */}
                <Card className="border border-border shadow-xs overflow-hidden rounded-2xl md:rounded-3xl bg-card">
                    {/* Soft Brand Header Canvas */}
                    <div className="relative h-24 sm:h-32 w-full bg-gradient-to-r from-primary/15 via-emerald-500/10 to-teal-500/15 dark:from-primary/20 dark:to-muted border-b border-primary/10 overflow-hidden">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#16a34a_1px,transparent_1px)] [background-size:16px_16px]" />
                        <div className="absolute -top-10 -right-10 size-48 bg-primary/15 rounded-full blur-2xl pointer-events-none" />
                    </div>

                    <CardContent className="pt-0 px-4 sm:px-6 md:px-8 pb-6">
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 -mt-10 sm:-mt-12 relative">
                            {/* Avatar */}
                            <div className="shrink-0 mx-auto sm:mx-0">
                                <div className="size-20 sm:size-24 rounded-2xl bg-card p-1 shadow-md ring-4 ring-card border border-border/80 overflow-hidden flex items-center justify-center">
                                    {profile.user.profilePhoto ? (
                                        <div className="relative size-full rounded-xl overflow-hidden">
                                            <SafeImage src={profile.user.profilePhoto} alt={sellerName} fill className="object-cover" sizes="96px" />
                                        </div>
                                    ) : (
                                        <div className="size-full rounded-xl bg-primary/10 text-primary flex items-center justify-center text-h2 sm:text-h1 font-bold">
                                            {initials}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Seller Details & Primary Actions */}
                            <div className="flex-1 pt-1 text-center sm:text-left flex flex-col justify-between">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                                            <h1 className="text-h2 sm:text-h1 font-bold text-foreground tracking-tight">{sellerName}</h1>
                                            {profile.user.isVerified && (
                                                <Badge className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full text-caption font-semibold gap-1 inline-flex items-center">
                                                    <ShieldCheck className="size-3.5" /> Verified Seller
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-caption text-foreground-secondary font-medium mt-1">
                                            <span className="inline-flex items-center gap-1"><Calendar className="size-3.5 text-foreground-subtle" /> Active since {joinDate}</span>
                                            {locationLabel && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5 text-foreground-subtle" /> {locationLabel}</span>}
                                            <span className="inline-flex items-center gap-1 text-primary font-semibold"><Tag className="size-3.5" /> {totalActive} live ads</span>
                                        </div>
                                    </div>

                                    <Button variant="outline" size="sm" onClick={handleShare} className="h-9 px-3.5 rounded-xl border-border hover:bg-muted/70 text-caption font-semibold gap-1.5 self-center sm:self-start cursor-pointer shadow-2xs">
                                        {copied ? <Check className="size-3.5 text-primary" /> : <Share2 className="size-3.5" />}
                                        {copied ? "Link Copied!" : "Share Profile"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Marketplace Trust Strip */}
                        <div className="mt-5 p-3 sm:p-3.5 rounded-2xl bg-muted/40 border border-border/70 flex items-center gap-3">
                            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <ShieldCheck className="size-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-caption font-bold text-foreground">Verified Individual Seller</p>
                                <p className="text-tiny text-foreground-secondary leading-snug">
                                    Click any listing below to inspect item photos, negotiate via real-time chat, and connect safely on Esparex.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Seller's Listings Showcase */}
                <section id="seller-active-listings" className="space-y-4 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                        <div className="flex items-center gap-2">
                            <h2 className="text-h3 font-bold text-foreground tracking-tight">Active Listings</h2>
                            <Badge className="bg-muted text-foreground-secondary font-bold px-2.5 py-0.5 rounded-full text-tiny border-none">{filteredAds.length}</Badge>
                        </div>
                        {totalActive > 3 && (
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search in seller's ads..."
                                    value={searchFilter}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                    className="w-full pl-8 pr-7 h-9 text-body-lg md:text-body bg-card border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-muted-foreground transition-all"
                                />
                                {searchFilter && (
                                    <button type="button" onClick={() => setSearchFilter("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary p-0.5 cursor-pointer" aria-label="Clear search">
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {filteredAds.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-14 text-center rounded-2xl border border-border bg-card shadow-xs">
                            <div className="size-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground"><LayoutGrid className="size-6" /></div>
                            <div className="space-y-1">
                                <p className="font-semibold text-foreground text-body">{searchFilter ? "No matching listings" : "No active listings"}</p>
                                <p className="text-caption text-foreground-secondary max-w-xs">{searchFilter ? `No ads matched "${searchFilter}". Try another keyword.` : `${sellerName} does not have any active listings right now.`}</p>
                            </div>
                            {searchFilter && <Button variant="outline" size="sm" onClick={() => setSearchFilter("")} className="h-8 rounded-lg text-caption font-semibold mt-1">Clear search filter</Button>}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 md:gap-4">
                            {filteredAds.map((ad, index) => (
                                <AdCardGrid key={String(ad.id)} ad={ad} href={buildAdHref(ad)} priority={index < 4} />
                            ))}
                        </div>
                    )}
                </section>
            </Container>
        </div>
    );
}
