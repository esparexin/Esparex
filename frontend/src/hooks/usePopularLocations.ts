"use client";
import { useQuery } from '@tanstack/react-query';
import { getPopularLocations, type Location } from "@/lib/api/user/locations";

export type PopularLocation = Location;

export const usePopularLocations = () => {
    return useQuery<PopularLocation[], Error>({
        queryKey: ['popularLocations'],
        queryFn: async () => {
            const result = await getPopularLocations();

            if (!Array.isArray(result)) {
                throw new Error('Invalid popular locations response');
            }

            return result;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        retry: 1, // ✅ allow one retry for transient failures
        refetchOnWindowFocus: false,
        refetchOnMount: true,
    });
};
