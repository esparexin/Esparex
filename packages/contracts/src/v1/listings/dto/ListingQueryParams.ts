export interface ListingQueryParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  condition?: string; // Replace with proper enum if ListingCondition exists
  brandId?: string;
  modelId?: string;
  locationId?: string;
}
