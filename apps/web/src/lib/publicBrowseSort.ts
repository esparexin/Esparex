export type SortOption =
  | "relevance"
  | "newest"
  | "price_low_high"
  | "price_high_low";

export const PUBLIC_BROWSE_SORT_LABELS: Record<SortOption, string> = {
  relevance: "Relevance",
  newest: "Newest",
  price_low_high: "Price: Low to High",
  price_high_low: "Price: High to Low",
};

export const PUBLIC_BROWSE_SORT_MAP: Record<SortOption, string> = {
  relevance: "newest",
  newest: "newest",
  price_low_high: "price-low",
  price_high_low: "price-high",
};
