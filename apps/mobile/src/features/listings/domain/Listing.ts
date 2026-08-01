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
  isFeatured: boolean;
  isPremium: boolean;
}
