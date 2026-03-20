"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function ReactQueryProvider({ children }: { children: ReactNode }) {
    // Create QueryClient instance with useState to ensure it's only created once
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Prevent automatic refetching in the background by default
                refetchOnWindowFocus: false,
                // Retry failed requests once
                retry: 1,
                // Cache data for 5 minutes by default
                staleTime: 5 * 60 * 1000,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
