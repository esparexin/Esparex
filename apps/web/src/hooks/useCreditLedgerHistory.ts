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

export function useCreditLedgerHistory(page: number = 1, limit: number = 4) {
  return useQuery<PaginatedLedgerResponse | null>({
    queryKey: ['credit-ledger-history', page, limit],
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ success?: boolean; data?: PaginatedLedgerResponse } | PaginatedLedgerResponse>(
          `/payments/credits/history?page=${page}&limit=${limit}`
        );
        const payload = res as {
          data?: PaginatedLedgerResponse | { items?: CreditLedgerDTO[]; pagination?: PaginatedLedgerResponse['pagination'] };
          items?: CreditLedgerDTO[];
          pagination?: PaginatedLedgerResponse['pagination'];
        } | null;

        // Standard API envelope: { success: true, data: { items, pagination } }
        if (payload?.data && 'items' in payload.data && 'pagination' in payload.data) {
          return payload.data as PaginatedLedgerResponse;
        }
        // Direct payload: { items, pagination }
        if (payload && 'items' in payload && 'pagination' in payload) {
          return payload as PaginatedLedgerResponse;
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
