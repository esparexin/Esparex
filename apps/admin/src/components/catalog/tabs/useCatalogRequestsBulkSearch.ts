"use client";

import { useState, useEffect } from "react";
import { getBrands } from "@/lib/api/brands";
import { getModels } from "@/lib/api/models";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { showAdminPopup } from "@/lib/popup/popupEvents";

interface UseCatalogRequestsBulkSearchParams {
  requestType: "brand" | "model";
}

export function useCatalogRequestsBulkSearch({ requestType }: UseCatalogRequestsBulkSearchParams) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        if (requestType === "brand") {
          const res = await getBrands({ search: searchQuery });
          const parsed = parseAdminResponse<{ id: string; name: string }>(res);
          setSearchResults(parsed.items.map((item) => ({ id: item.id, name: item.name })));
        } else {
          const res = await getModels({ search: searchQuery });
          const parsed = parseAdminResponse<{ id: string; name: string }>(res);
          setSearchResults(parsed.items.map((item) => ({ id: item.id, name: item.name })));
        }
      } catch (e) {
        showAdminPopup({
          type: "error",
          title: "Search Failed",
          message: e instanceof Error ? e.message : "Unable to complete catalog search.",
        });
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, requestType]);

  const resetSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedTargetId(null);
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    searching,
    selectedTargetId,
    setSelectedTargetId,
    resetSearch,
  };
}
