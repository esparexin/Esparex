import { adminFetch } from "./adminClient";
import { parseAdminResponse } from "./parseAdminResponse";
import { ADMIN_ROUTES } from "./routes";
import type { FinanceStats, Transaction } from "@/types/transaction";

export type PaginatedFinanceTransactions = {
    items: Transaction[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
};

type FinanceTransactionQuery = {
    search: string;
    status: string;
    page?: number;
    limit?: number;
};

export async function fetchFinanceTransactions({
    search,
    status,
    page = 1,
    limit = 20,
}: FinanceTransactionQuery): Promise<PaginatedFinanceTransactions> {
    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    if (search.trim()) {
        query.set("search", search.trim());
    }
    if (status !== "all") {
        query.set("status", status);
    }

    const response = await adminFetch<unknown>(`${ADMIN_ROUTES.FINANCE_TRANSACTIONS}?${query.toString()}`);
    const parsed = parseAdminResponse<Transaction>(response);
    const pagination = parsed.pagination;

    return {
        items: parsed.items,
        pagination: {
            page: pagination?.page ?? page,
            limit: pagination?.limit ?? limit,
            total: pagination?.total ?? parsed.items.length,
            pages: pagination?.pages ?? pagination?.totalPages ?? 1,
        },
    };
}

export async function fetchFinanceStats(): Promise<FinanceStats | null> {
    const response = await adminFetch<unknown>(ADMIN_ROUTES.FINANCE_STATS);
    return parseAdminResponse<never, FinanceStats>(response).data;
}
