import Link from "next/link";
import { BadgeCheck, CalendarClock, Megaphone } from "lucide-react";
import { AdCardGrid } from "@/components/user/ad-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Ad } from "@/schemas/ad.schema";
import type { SellerProfilePayload } from "@/api/user/users";
import { formatStableDate } from "@/utils/formatters";
import { generateAdSlug } from "@/utils/slug";
import { formatLocationDisplay } from "@/lib/location/locationService";

interface SellerProfilePageProps {
    profile: SellerProfilePayload;
}

const buildAdHref = (ad: Ad): string => {
    const adId = String(ad.id || "").trim();
    if (!adId) return "/search";
    const slug = ad.seoSlug?.trim() || generateAdSlug(ad.title || "ad");
    return `/ads/${encodeURIComponent(slug)}-${encodeURIComponent(adId)}`;
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

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8 space-y-6">
                <Link
                    href="/search"
                    className="inline-flex text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                    Back to search
                </Link>

                <Card className="border-slate-200 bg-white">
                    <CardContent className="p-5 md:p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-4">
                                {profile.user.profilePhoto ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={profile.user.profilePhoto}
                                        alt={sellerName}
                                        className="h-16 w-16 rounded-full object-cover border border-slate-200"
                                    />
                                ) : (
                                    <div className="h-16 w-16 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xl font-bold">
                                        {initials}
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl font-bold text-slate-900">{sellerName}</h1>
                                        {profile.user.isVerified && (
                                            <Badge className="bg-emerald-600 text-white">Verified</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500">Joined {joinDate}</p>
                                    {locationLabel && (
                                        <p className="text-sm text-slate-500">{locationLabel}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Card className="border-slate-200 bg-white">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <BadgeCheck className="h-4 w-4" />
                                Verification
                            </div>
                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {profile.user.isVerified ? "Verified" : "Standard"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 bg-white">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <CalendarClock className="h-4 w-4" />
                                Member Since
                            </div>
                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {joinDate}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 bg-white">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <Megaphone className="h-4 w-4" />
                                Active Ads Count
                            </div>
                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {profile.ads.length}
                            </p>
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Ads by {sellerName}
                    </h2>
                    {profile.ads.length === 0 ? (
                        <Card className="border-slate-200 bg-white">
                            <CardContent className="p-6 text-sm text-slate-600">
                                No active ads found for this seller.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                            {profile.ads.map((ad) => (
                                <AdCardGrid key={String(ad.id)} ad={ad} href={buildAdHref(ad)} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
