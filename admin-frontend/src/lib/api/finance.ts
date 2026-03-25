import { adminFetch } from "./adminClient";
import { parseAdminResponse } from "./parseAdminResponse";
import { ADMIN_ROUTES } from "./routes";
import type { FinanceStats, Transaction } from "@/types/transaction";

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
}: FinanceTransactionQuery): Promise<Transaction[]> {
    const query = new URLSearchParams({
        search,
        status,
        page: String(page),
        limit: String(limit),
    }).toString();

    const response = await adminFetch<unknown>(`${ADMIN_ROUTES.FINANCE_TRANSACTIONS}?${query}`);
    return parseAdminResponse<Transaction>(response).items;
}

export async function fetchFinanceStats(): Promise<FinanceStats | null> {
    const response = await adminFetch<unknown>(ADMIN_ROUTES.FINANCE_STATS);
    return parseAdminResponse<never, FinanceStats>(response).data;
}
