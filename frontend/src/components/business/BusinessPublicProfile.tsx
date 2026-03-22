/**
 * Business Public Profile Component
 * Read-only public-facing business profile display with listing tabs.
 */

import { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { useBusiness } from '../../hooks/useBusiness';
import { Separator } from '../ui/separator';
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

export function BusinessPublicProfile({
  businessId,
  onContact,
  onShare,
  onLike,
}: BusinessPublicProfileProps) {
  const { businessData: business, isLoading } = useBusiness(null, businessId);
  const [activeTab, setActiveTab] = useState<ListingTab>('ads');

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

  const allTabs: { key: ListingTab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'ads', label: 'Listings', icon: <LayoutGrid size={15} />, count: ads.length },
    { key: 'services', label: 'Services', icon: <Briefcase size={15} />, count: services.length },
    { key: 'spare-parts', label: 'Spare Parts', icon: <CircuitBoard size={15} />, count: spareParts.length },
  ];
  const tabs = allTabs.filter(t => t.count > 0);

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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-slate-200 rounded-lg" />
          <div className="h-64 bg-slate-100 rounded-lg" />
        </div>
      </div>
    );
  }

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
    <div className="p-6 space-y-6">
      {/* Hero Section */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-32" />
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-[-60px] relative">
            {/* Logo/Avatar */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg p-4 shadow-md w-fit">
                <Building2 className="h-24 w-24 text-blue-600" />
              </div>
            </div>

            {/* Business Header Info */}
            <div className="md:col-span-2 pt-6">
              <div className="space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold">{business.businessName}</h1>
                    <p className="text-muted-foreground text-lg">{business.tagline}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onLike?.(businessId)}>
                      <Heart className="h-4 w-4 mr-1" />
                      Save
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
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>
                      {business.rating.toFixed(1)} ({business.totalReviews || 0} reviews)
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About Section */}
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

      <Separator />

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Business Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    href={`https://wa.me/${business.whatsappNumber.replace(/\D/g, '')}`}
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

          <Button
            onClick={() => onContact?.(businessId)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Get in Touch
          </Button>
        </CardContent>
      </Card>

      {/* Location */}
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
                src={mapData.embedUrl}
                className="h-64 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-3 bg-[linear-gradient(135deg,#eff6ff,#f8fafc)] px-6 text-center">
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
                <p className="text-sm text-muted-foreground">
                  {mapData.hasCoordinates
                    ? 'Interactive map preview loaded from OpenStreetMap.'
                    : 'Open the full map in a new tab.'}
                </p>
                <a
                  href={mapData.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                >
                  Open in Maps <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Listings Tabs */}
      {tabs.length > 0 && (
        <div className="space-y-4">
          {/* Tab bar */}
          <div className="flex gap-1 border-b border-slate-200">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
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

          {/* Grid */}
          {activeItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
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
            <p className="py-10 text-center text-sm text-slate-400">
              No {activeTab === 'ads' ? 'listings' : activeTab === 'services' ? 'services' : 'spare parts'} available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MessageCircle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// Export as 'PublicProfile' for backward compatibility with old imports
export { BusinessPublicProfile as PublicProfile };
