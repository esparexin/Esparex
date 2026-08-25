import { Megaphone, LayoutGrid } from "@/icons/IconRegistry";
import { AdCardGrid } from "@/components/user/ad-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@esparex/ui";
import { type Listing as Ad } from "@/lib/api/user/listings";
import type { SellerProfilePayload } from "@/lib/api/user/users";
import { formatStableDate } from "@/lib/formatters";
import { LocationFacade } from "@esparex/shared";
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
    return LocationFacade.format(profile.user.location);
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
        <div className="bg-background pb-4">
            <Container variant="lg" className="py-4 md:py-6 space-y-5">
                <BackButton
                    label="Back"
                    className="text-muted-foreground hover:text-foreground border border-transparent hover:border-border text-caption"
                />

                {/* Hero Profile Card */}
                <Card className="border border-border shadow-xs overflow-hidden rounded-2xl bg-card">
                    <div className="h-28 md:h-36 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900" />

                    <CardContent className="pt-0 px-4 md:px-6 pb-6">
                        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 -mt-10 sm:-mt-12 relative">
                            {/* Avatar */}
                            <div className="shrink-0">
                                <div className="bg-card p-1.5 rounded-2xl shadow-xs border border-border w-fit mx-auto sm:mx-0">
                                    {profile.user.profilePhoto ? (
                                        <img
                                            src={profile.user.profilePhoto}
                                            alt={sellerName}
                                            className="h-20 w-20 md:h-24 md:w-24 rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="h-20 w-20 md:h-24 md:w-24 rounded-xl bg-muted text-foreground-secondary flex items-center justify-center text-2xl md:text-3xl font-bold">
                                            {initials}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 pt-2 sm:pt-4 space-y-4 text-center sm:text-left">
                                <div>
                                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                        <h1 className="text-h2 font-bold text-foreground tracking-tight">{sellerName}</h1>
                                        {profile.user.isVerified && (
                                            <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-none px-2 rounded-lg text-tiny">
                                                Verified
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-caption text-foreground-subtle font-medium">
                                        Active since {joinDate} {locationLabel && <span className="mx-1 opacity-50">·</span>} {locationLabel}
                                    </p>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-2 bg-muted/40 border border-border rounded-2xl p-3 text-left mx-auto sm:mx-0 w-full max-w-sm sm:max-w-xl">
                                    <div className="space-y-0.5">
                                        <p className="text-tiny font-bold text-foreground-subtle uppercase tracking-wider flex items-center gap-1">
                                            <Megaphone className="w-3 h-3" /> Live Listings
                                        </p>
                                        <p className="text-h3 font-bold text-foreground">{listingSummary.totalActive}</p>
                                    </div>
                                    <div className="space-y-0.5 border-l border-border pl-3">
                                        <p className="text-tiny font-bold text-foreground-subtle uppercase tracking-wider flex items-center gap-1">
                                            <LayoutGrid className="w-3 h-3" /> Showing Here
                                        </p>
                                        <p className="text-h3 font-bold text-foreground">{listingSummary.visibleCount}</p>
                                    </div>
                                </div>
                                <p className="text-caption text-foreground-subtle">
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
                    <div className="flex items-center gap-2 border-b border-border pb-2.5">
                        <h2 className="text-body-lg font-bold text-foreground">Active Listings</h2>
                        <Badge variant="secondary" className="bg-muted text-foreground-secondary font-bold px-2 rounded-full text-tiny">
                            {profile.ads.length}
                        </Badge>
                    </div>

                    {profile.ads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-14 text-center border-2 border-dashed border-border rounded-2xl bg-card">
                            <LayoutGrid className="h-8 w-8 text-foreground-subtle" />
                            <p className="font-semibold text-foreground-subtle text-body">No active listings</p>
                            <p className="text-caption text-foreground-subtle max-w-xs">
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
            </Container>
        </div>
    );
}
