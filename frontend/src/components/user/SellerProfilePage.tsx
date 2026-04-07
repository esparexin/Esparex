import { Megaphone, LayoutGrid } from "lucide-react";
import { AdCardGrid } from "@/components/user/ad-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { type Listing as Ad } from "@/lib/api/user/listings";
import type { SellerProfilePayload } from "@/lib/api/user/users";
import { formatStableDate } from "@/lib/formatters";
import { formatLocationDisplay } from "@/lib/listings/locationUtils";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";
import { BackButton } from "@/components/common/BackButton";

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

const toLocationLabel = (profile: SellerProfilePayload): string => {
    return formatLocationDisplay(profile.user.location);
};

export function SellerProfilePage({ profile }: SellerProfilePageProps) {
    const sellerName = profile.user.name || "Seller";
    const joinDate = profile.user.createdAt
        ? formatStableDate(profile.user.createdAt)
        : "N/A";
    const initials = sellerName.trim().charAt(0).toUpperCase() || "S";
    const locationLabel = toLocationLabel(profile);
    const listingSummary = profile.listingSummary || {
        totalActive: profile.ads?.length || 0,
        visibleCount: profile.ads?.length || 0,
        hasMore: false,
    };

    return (
        <main className="min-h-screen bg-slate-50 pb-20">
            <div className="mx-auto w-full max-w-5xl px-4 py-6 md:py-8 space-y-5">
                <BackButton
                    label="Back"
                    className="text-muted-foreground hover:text-foreground border border-transparent hover:border-slate-200 text-sm"
                />

                {/* Hero Profile Card */}
                <Card className="border-none shadow-sm md:shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden rounded-2xl md:rounded-[2rem]">
                    <div className="h-28 md:h-36 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900" />

                    <CardContent className="pt-0 px-4 md:px-6 pb-6">
                        <div className="flex flex-col md:flex-row gap-4 md:gap-6 mt-[-44px] relative">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                <div className="bg-white p-1.5 rounded-2xl shadow-md w-fit mx-auto md:mx-0">
                                    {profile.user.profilePhoto ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={profile.user.profilePhoto}
                                            alt={sellerName}
                                            className="h-20 w-20 md:h-24 md:w-24 rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="h-20 w-20 md:h-24 md:w-24 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-2xl md:text-3xl font-bold">
                                            {initials}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 pt-2 md:pt-14 space-y-4 text-center md:text-left">
                                <div>
                                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">{sellerName}</h1>
                                        {profile.user.isVerified && (
                                            <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-none px-2 rounded-lg text-xs">
                                                Verified
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs md:text-sm font-medium text-slate-400">
                                        Active since {joinDate} {locationLabel && <span className="mx-1 opacity-50">·</span>} {locationLabel}
                                    </p>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-3 text-left mx-auto md:mx-0 w-full max-w-sm md:max-w-xl">
                                    <div className="space-y-0.5">
                                        <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            <Megaphone className="w-3 h-3" /> Live Listings
                                        </p>
                                        <p className="text-xl font-bold text-foreground">{listingSummary.totalActive}</p>
                                    </div>
                                    <div className="space-y-0.5 border-l border-slate-200 pl-3">
                                        <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            <LayoutGrid className="w-3 h-3" /> Showing Here
                                        </p>
                                        <p className="text-xl font-bold text-foreground">{listingSummary.visibleCount}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400">
                                    {listingSummary.hasMore
                                        ? `Showing the latest ${listingSummary.visibleCount} public listings from this seller.`
                                        : "All active listings from this seller are shown below."}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Listings Section */}
                <section id="seller-active-listings" className="space-y-3 pt-2 scroll-mt-24">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                        <h2 className="text-base font-bold text-foreground">Active Listings</h2>
                        <Badge variant="secondary" className="bg-slate-100 text-muted-foreground font-bold px-2 rounded-full text-xs">
                            {profile.ads.length}
                        </Badge>
                    </div>

                    {profile.ads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-14 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                            <LayoutGrid className="h-8 w-8 text-slate-300" />
                            <p className="font-semibold text-slate-400 text-sm">No active listings</p>
                            <p className="text-xs text-slate-400 max-w-xs">
                                {sellerName} does not have any active listings right now.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4 md:gap-4">
                            {profile.ads.map((ad, index) => (
                                <AdCardGrid key={String(ad.id)} ad={ad} href={buildAdHref(ad)} priority={index < 4} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
