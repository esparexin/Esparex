/**
 * Business Public Profile Component
 * Read-only public-facing business profile display with listing tabs.
 */

import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Building2,
  Star,
  Share2,
  Heart,
  Briefcase,
  CircuitBoard,
  LayoutGrid,
  MessageCircle,
} from 'lucide-react';
import { useBusiness } from '../../hooks/useBusiness';
import { AdCardGrid } from '../user/ad-card';
import { getBusinessServices, getBusinessAds, getBusinessSpareParts } from '../../api/user/businesses';
import { generateAdSlug } from '@/utils/slug';
import type { Ad } from '@/schemas/ad.schema';
import type { Service } from '@/api/user/businesses';

type ListingTab = 'ads' | 'services' | 'spare-parts';

interface BusinessPublicProfileProps {
  businessId: string;
  onContact?: (businessId: string) => void;
  onShare?: (businessId: string) => void;
  onLike?: (businessId: string) => void;
  // Legacy props for backward compatibility
  navigateTo?: (page: string, ...args: unknown[]) => void;
  navigateBack?: () => void;
  isOwner?: boolean;
  currentUser?: unknown;
}

const buildListingHref = (item: Ad | Service): string => {
  const record = item as Record<string, unknown>;
  const id = String(record.id || record._id || '');
  if (!id) return '/search';
  const listingType = String(record.listingType || 'ad');
  const slug = String(record.seoSlug || generateAdSlug(String(record.title || 'listing')));
  if (listingType === 'service') return `/services/${slug}-${id}`;
  if (listingType === 'spare_part') return `/spare-part-listings/${slug}-${id}`;
  return `/ads/${slug}-${id}`;
};

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Hero Skeleton */}
      <div className="rounded-lg overflow-hidden">
        <div className="h-32 bg-slate-200" />
        <div className="bg-white p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-[-48px]">
            <div className="md:col-span-1">
              <div className="h-24 w-24 bg-slate-200 rounded-lg" />
            </div>
            <div className="md:col-span-2 pt-4 space-y-3">
              <div className="h-6 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="h-4 bg-slate-100 rounded w-1/4" />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Skeleton */}
      <div className="rounded-lg bg-white border border-slate-100 p-5 space-y-3">
        <div className="h-5 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="h-10 bg-slate-100 rounded-lg" />
          <div className="h-10 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-10 bg-slate-200 rounded-lg" />
      </div>

      {/* Listings Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-48 bg-slate-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ─── Empty Tab State ─────────────────────────────────────────────────────────

function EmptyTabState({ tab }: { tab: ListingTab }) {
  const config = {
    ads: { icon: <LayoutGrid className="h-10 w-10 text-slate-300" />, label: 'listings' },
    services: { icon: <Briefcase className="h-10 w-10 text-slate-300" />, label: 'services' },
    'spare-parts': { icon: <CircuitBoard className="h-10 w-10 text-slate-300" />, label: 'spare parts' },
  };
  const { icon, label } = config[tab];
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon}
      <p className="font-semibold text-slate-500 text-sm">No {label} yet</p>
      <p className="text-xs text-slate-400 max-w-xs">
        This business hasn't published any {label} yet. Check back later.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BusinessPublicProfile({
  businessId,
  onContact,
  onShare,
  onLike,
}: BusinessPublicProfileProps) {
  const { businessData: business, isLoading } = useBusiness(null, businessId);
  const [activeTab, setActiveTab] = useState<ListingTab>('ads');
  const [liked, setLiked] = useState(false);

  const { data: ads = [] } = useQuery({
    queryKey: ['business-ads', businessId],
    queryFn: () => getBusinessAds(businessId),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['business-services', businessId],
    queryFn: () => getBusinessServices(businessId),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: spareParts = [] } = useQuery({
    queryKey: ['business-spare-parts', businessId],
    queryFn: () => getBusinessSpareParts(businessId),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  });

  const allTabs = useMemo(() => [
    { key: 'ads' as const, label: 'Listings', icon: <LayoutGrid size={15} />, count: ads.length },
    { key: 'services' as const, label: 'Services', icon: <Briefcase size={15} />, count: services.length },
    { key: 'spare-parts' as const, label: 'Spare Parts', icon: <CircuitBoard size={15} />, count: spareParts.length },
  ], [ads.length, services.length, spareParts.length]);

  const tabs = useMemo(() => allTabs.filter(t => t.count > 0), [allTabs]);

  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.key === activeTab)) {
      setActiveTab(tabs[0]!.key);
    }
  }, [tabs, activeTab]);

  const activeItems: (Ad | Service)[] = useMemo(() => {
    if (activeTab === 'services') return services as Service[];
    if (activeTab === 'spare-parts') return spareParts;
    return ads;
  }, [activeTab, ads, services, spareParts]);

  const mapData = useMemo(() => {
    if (!business) return null;

    const businessRecord = business as unknown as Record<string, unknown>;
    const locationRecord =
      businessRecord.location && typeof businessRecord.location === 'object'
        ? (businessRecord.location as Record<string, unknown>)
        : null;
    const point =
      locationRecord?.coordinates && typeof locationRecord.coordinates === 'object'
        ? (locationRecord.coordinates as Record<string, unknown>)
        : null;
    const rawCoordinates = Array.isArray(point?.coordinates) ? point?.coordinates : null;

    const lng = rawCoordinates && rawCoordinates.length === 2 ? Number(rawCoordinates[0]) : NaN;
    const lat = rawCoordinates && rawCoordinates.length === 2 ? Number(rawCoordinates[1]) : NaN;
    const hasCoordinates = Number.isFinite(lng) && Number.isFinite(lat);

    const addressParts = [
      business.location?.address,
      business.location?.city,
      business.location?.state,
      business.location?.pincode,
    ].filter(Boolean);
    const addressQuery = addressParts.join(', ');

    if (hasCoordinates) {
      const delta = 0.02;
      const bbox = [lng - delta, lat - delta, lng + delta, lat + delta]
        .map(v => v.toFixed(6))
        .join('%2C');
      return {
        embedUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(6)}%2C${lng.toFixed(6)}`,
        externalUrl: `https://www.openstreetmap.org/?mlat=${lat.toFixed(6)}&mlon=${lng.toFixed(6)}#map=15/${lat.toFixed(6)}/${lng.toFixed(6)}`,
        hasCoordinates: true,
        addressQuery,
      };
    }

    return {
      embedUrl: null,
      externalUrl: addressQuery
        ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(addressQuery)}`
        : null,
      hasCoordinates: false,
      addressQuery,
    };
  }, [business]);

  // ── Business logo / cover helpers ─────────────────────────────────────────
  const businessRecord = business as unknown as Record<string, unknown> | undefined;
  const logoUrl =
    typeof businessRecord?.logo === 'string' ? businessRecord.logo :
    typeof businessRecord?.profileImage === 'string' ? businessRecord.profileImage :
    null;
  const coverUrl =
    typeof businessRecord?.coverPhoto === 'string' ? businessRecord.coverPhoto :
    typeof businessRecord?.coverImage === 'string' ? businessRecord.coverImage :
    null;

  // ── Sticky CTA helpers ────────────────────────────────────────────────────
  const whatsappHref = business?.whatsappNumber
    ? `https://wa.me/${business.whatsappNumber.replace(/\D/g, '')}`
    : null;
  const hasStickyCTA = !!(business?.contactNumber || whatsappHref);

  if (isLoading) return <ProfileSkeleton />;

  if (!business) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Business not found
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* ── Page body ────────────────────────────────────────────────────── */}
      <div className={`p-6 space-y-6 ${hasStickyCTA ? 'pb-24 md:pb-6' : ''}`}>

        {/* ── Hero Section ───────────────────────────────────────────────── */}
        <Card className="overflow-hidden">
          {/* Cover */}
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`${business.businessName} cover`}
              className="h-32 w-full object-cover"
            />
          ) : (
            <div className="h-32 bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-500" />
          )}

          <CardContent className="pt-0">
            <div className="flex flex-col md:flex-row gap-6 mt-[-48px] relative">
              {/* Logo / Avatar */}
              <div className="flex-shrink-0">
                <div className="bg-white rounded-lg p-2 shadow-md w-fit border border-slate-100 mx-auto md:mx-0">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={`${business.businessName} logo`}
                      className="h-24 w-24 rounded-md object-cover"
                    />
                  ) : (
                    <Building2 className="h-24 w-24 text-blue-600" />
                  )}
                </div>
              </div>

              {/* Business Header Info */}
              <div className="flex-1 pt-4 md:pt-14 space-y-4 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold">{business.businessName}</h1>
                    <p className="text-muted-foreground text-lg">{business.tagline}</p>
                  </div>
                  <div className="flex gap-2 justify-center md:justify-end">
                      {/* Save / Like toggle */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLiked(prev => !prev);
                          onLike?.(businessId);
                        }}
                        className={liked ? 'border-red-200 text-red-500 bg-red-50' : ''}
                      >
                        <Heart className={`h-4 w-4 mr-1 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                        {liked ? 'Saved' : 'Save'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onShare?.(businessId)}>
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{business.businessType}</Badge>
                    {business.verified && (
                      <Badge className="bg-green-100 text-green-800">✓ Verified Business</Badge>
                    )}
                  </div>

                  {business.rating ? (
                    <div className="flex items-center gap-1.5 text-sm text-slate-700">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{business.rating.toFixed(1)}</span>
                      <span className="text-slate-500">· {business.totalReviews || 0} reviews</span>
                    </div>
                  ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 2-Column Desktop Layout ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* ── About Section ──────────────────────────────────────────────── */}
            {business.description ? (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">{business.description}</p>
                  {business.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {business.website}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {/* ── Listings Tabs ──────────────────────────────────────────────── */}
            {tabs.length > 0 && (
              <div className="space-y-4">
                {/* Tab bar — scrolls horizontally on narrow screens */}
                <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
                  {tabs.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 ${
                        activeTab === tab.key
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                      <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Grid or empty state */}
                {activeItems.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                    {activeItems.map(item => {
                      const record = item as Record<string, unknown>;
                      const id = String(record.id || record._id || '');
                      return (
                        <AdCardGrid
                          key={id}
                          ad={item as Ad}
                          href={buildListingHref(item)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <EmptyTabState tab={activeTab} />
                )}
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* ── Contact Information ────────────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Business Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {business.contactNumber ? (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-blue-600 mt-1 shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <a href={`tel:${business.contactNumber}`} className="font-semibold hover:text-blue-600">
                          {business.contactNumber}
                        </a>
                      </div>
                    </div>
                  ) : null}

                  {business.whatsappNumber ? (
                    <div className="flex items-start gap-3">
                      <MessageCircle className="h-5 w-5 text-green-600 mt-1 shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">WhatsApp</p>
                        <a
                          href={whatsappHref ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold hover:text-green-600"
                        >
                          {business.whatsappNumber}
                        </a>
                      </div>
                    </div>
                  ) : null}

                  {business.email ? (
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-red-600 mt-1 shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <a href={`mailto:${business.email}`} className="font-semibold hover:text-red-600">
                          {business.email}
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* WhatsApp CTA button — prominent, styled */}
                {whatsappHref ? (
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="block mt-2">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Chat on WhatsApp
                    </Button>
                  </a>
                ) : (
                  <Button
                    onClick={() => onContact?.(businessId)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
                  >
                    Get in Touch
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* ── Location ──────────────────────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mapData?.addressQuery ? (
                  <address className="text-muted-foreground not-italic text-sm">
                    {business.location?.address && <>{business.location.address}<br /></>}
                    {[business.location?.city, business.location?.state, business.location?.pincode]
                      .filter(Boolean).join(', ')}
                  </address>
                ) : null}

                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  {mapData?.embedUrl ? (
                    <iframe
                      title={`${business.businessName} location map`}
                      aria-label={`Map showing ${business.businessName} location`}
                      src={mapData.embedUrl}
                      className="h-48 w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <div className="flex h-48 flex-col items-center justify-center gap-3 bg-[linear-gradient(135deg,#eff6ff,#f8fafc)] px-6 text-center">
                      <MapPin className="h-8 w-8 text-blue-600" />
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">Open business location in maps</p>
                        <p className="text-sm text-muted-foreground">
                          {mapData?.addressQuery || 'Address details are available above.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {mapData?.externalUrl ? (
                    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
                      <p className="text-xs text-muted-foreground line-clamp-1 mr-2">
                        {mapData.hasCoordinates
                          ? 'Interactive map loaded'
                          : 'Open in new tab'}
                      </p>
                      <a
                        href={mapData.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline shrink-0"
                      >
                        Maps <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Sticky Mobile CTA Bar ─────────────────────────────────────────── */}
      {hasStickyCTA && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-slate-200 px-4 py-3 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          {business.contactNumber && (
            <a href={`tel:${business.contactNumber}`} className="flex-1">
              <Button variant="outline" className="w-full gap-2 border-blue-200 text-blue-600">
                <Phone className="h-4 w-4" />
                Call
              </Button>
            </a>
          )}
          {whatsappHref && (
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </a>
          )}
        </div>
      )}
    </>
  );
}

// Export as 'PublicProfile' for backward compatibility with old imports
export { BusinessPublicProfile as PublicProfile };
