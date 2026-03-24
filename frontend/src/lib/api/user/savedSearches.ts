import { API_ROUTES } from "@/lib/api/routes";
import { apiClient } from "@/lib/api/client";
import type { SavedSearchCreatePayload } from "@shared/schemas/savedSearch.schema";

export interface SavedSearch {
  id: string;
  userId?: string;
  query?: string;
  categoryId?: string;
  locationId?: string;
  priceMin?: number;
  priceMax?: number;
  createdAt?: string;
}

const normalizeSavedSearch = (value: unknown): SavedSearch | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const idValue = record.id ?? record._id;
  if (typeof idValue !== "string" || idValue.length === 0) return null;

  return {
    id: idValue,
    userId: typeof record.userId === "string" ? record.userId : undefined,
    query: typeof record.query === "string" ? record.query : undefined,
    categoryId: typeof record.categoryId === "string" ? record.categoryId : undefined,
    locationId: typeof record.locationId === "string" ? record.locationId : undefined,
    priceMin: typeof record.priceMin === "number" ? record.priceMin : undefined,
    priceMax: typeof record.priceMax === "number" ? record.priceMax : undefined,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : undefined,
  };
};

const normalizeSavedSearchList = (value: unknown): SavedSearch[] => {
  if (Array.isArray(value)) {
    return value.map(normalizeSavedSearch).filter((item): item is SavedSearch => Boolean(item));
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      return record.data
        .map(normalizeSavedSearch)
        .filter((item): item is SavedSearch => Boolean(item));
    }
  }

  return [];
};

export const listSavedSearches = async (): Promise<SavedSearch[]> => {
  const response = await apiClient.get<unknown>(API_ROUTES.USER.SMART_ALERTS_SAVED_SEARCHES);
  return normalizeSavedSearchList(response);
};

export const createSavedSearch = async (
  payload: SavedSearchCreatePayload
): Promise<SavedSearch | null> => {
  const response = await apiClient.post<unknown>(API_ROUTES.USER.SMART_ALERTS_SAVED_SEARCHES, payload);
  return normalizeSavedSearch(response) ?? normalizeSavedSearch((response as { data?: unknown })?.data);
};

export const removeSavedSearch = async (id: string): Promise<void> => {
  await apiClient.delete(API_ROUTES.USER.SMART_ALERTS_SAVED_SEARCH_DETAIL(id));
};

