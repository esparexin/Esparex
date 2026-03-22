import Link from "next/link";
import { BadgeCheck, Megaphone, ArrowLeft, LayoutGrid, Clock, Star } from "lucide-react";
import { AdCardGrid } from "@/components/user/ad-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    
    // Default fallback if reputation is missing in some environments
    const rep = profile.reputation || {
        score: 0,
        adsPosted: profile.ads?.length || 0,
        responseRate: 0,
        averageResponseTime: 0
    };

    return (
        <main className="min-h-screen bg-slate-50 pb-16">
            <div className="mx-auto w-full max-w-5xl px-4 py-8 space-y-6">
                
                {/* Back Button */}
                <Link href="/search" className="inline-block">
                    <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-200">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Search
                    </Button>
                </Link>

                {/* Hero Profile Card */}
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden rounded-[2rem]">
                    {/* Dark gradient cover */}
                    <div className="h-32 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900" />
                    
                    <CardContent className="pt-0 px-6 pb-8">
                        <div className="flex flex-col md:flex-row gap-6 mt-[-48px] relative">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                <div className="bg-white p-2 rounded-full shadow-md w-fit mx-auto md:mx-0">
                                    {profile.user.profilePhoto ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={profile.user.profilePhoto}
                                            alt={sellerName}
                                            className="h-24 w-24 rounded-full object-cover border border-slate-100"
                                        />
                                    ) : (
                                        <div className="h-24 w-24 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-3xl font-bold border border-slate-200 shadow-inner">
                                            {initials}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 pt-4 md:pt-14 space-y-5 text-center md:text-left">
                                <div>
                                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
                                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{sellerName}</h1>
                                        {profile.user.isVerified && (
                                            <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-none px-2 rounded-md">
                                                Verified
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Active since {joinDate} {locationLabel && <span className="mx-1.5 opacity-50">•</span>} {locationLabel}
                                    </p>
                                </div>
                                
                                {/* Compact Stats Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left mx-auto md:mx-0 w-full max-w-2xl">
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Megaphone className="w-3.5 h-3.5" /> Published
                                        </p>
                                        <p className="text-lg font-bold text-slate-900">{profile.ads.length}</p>
                                    </div>
                                    <div className="space-y-1 sm:border-l sm:border-slate-200/60 sm:pl-3">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Star className="w-3.5 h-3.5" /> Score
                                        </p>
                                        <p className="text-lg font-bold text-slate-900">{typeof rep.score === 'number' ? rep.score.toFixed(1) : 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1 sm:border-l sm:border-slate-200/60 sm:pl-3">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <BadgeCheck className="w-3.5 h-3.5" /> Resp. Rate
                                        </p>
                                        <p className="text-lg font-bold text-slate-900">
                                            {rep.responseRate ? `${Math.round(rep.responseRate)}%` : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="space-y-1 sm:border-l sm:border-slate-200/60 sm:pl-3">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" /> Response
                                        </p>
                                        <p className="text-lg font-bold text-slate-900">
                                            {rep.averageResponseTime ? `${Math.round(rep.averageResponseTime)}m` : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Listings Section */}
                <section className="space-y-4 pt-4">
                     <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                        <h2 className="text-xl font-bold text-slate-900">
                            Active Listings
                        </h2>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold px-2.5 rounded-full">
                            {profile.ads.length}
                        </Badge>
                    </div>

                    {profile.ads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                            <LayoutGrid className="h-10 w-10 text-slate-300" />
                            <p className="font-semibold text-slate-500 text-sm">No active listings</p>
                            <p className="text-xs text-slate-400 max-w-xs">
                                {sellerName} does not have any active listings right now.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
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
