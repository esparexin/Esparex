export interface ListingPrice {
  amount: number;
  currency: string;
  formatted: string;
}

export interface SellerSummary {
  id: string;
  name: string;
  type: 'business' | 'user';
  isVerified: boolean;
  avatarUrl?: string;
  joinedAt?: Date;
}

export interface ListingImage {
  url: string;
  isPrimary: boolean;
  thumbnailUrl?: string;
}

export interface ListingLocation {
  city?: string;
  state?: string;
  display?: string;
  locationId?: string;
}

export interface ListingSparePart {
  id: string;
  name: string;
  brand?: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: ListingPrice;
  seller: SellerSummary;
  images: ListingImage[];
  location?: ListingLocation;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
  category?: string;
  categoryId?: string;
  condition?: 'power_on' | 'power_off';
  spareParts?: ListingSparePart[];
  isFeatured: boolean;
  isSpotlight?: boolean;
  isPremium: boolean;
}
