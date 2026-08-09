import { useQuery } from '@tanstack/react-query';
import type { CreditLedgerDTO } from '@esparex/contracts';
import { apiClient } from '@/lib/api/client';
import logger from '@/lib/logger';

export interface PaginatedLedgerResponse {
  items: CreditLedgerDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useCreditLedgerHistory(page: number = 1, limit: number = 10) {
  return useQuery<PaginatedLedgerResponse | null>({
    queryKey: ['credit-ledger-history', page, limit],
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ success?: boolean; data?: PaginatedLedgerResponse }>(
          `/payments/credits/history?page=${page}&limit=${limit}`
        );
        if (res.data) {
          return res.data;
        }
        return null;
      } catch (error) {
        logger.error('Failed to fetch credit ledger history:', error);
        return null;
      }
    },
    staleTime: 30 * 1000,
  });
}
