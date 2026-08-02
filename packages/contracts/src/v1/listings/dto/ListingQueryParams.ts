export interface ListingQueryParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  condition?: string;
  brandId?: string;
  modelId?: string;
  locationId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'newest' | 'price-low' | 'price-high' | 'distance' | 'trending';
}
