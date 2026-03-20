"use client";
import { useQuery } from '@tanstack/react-query';
import { getPopularLocations, type Location } from '@/api/user/locations';

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
        staleTime: 1000 * 60 * 60, // 1 hour (very static)
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        retry: 1, // ✅ allow one retry for transient failures
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
};
