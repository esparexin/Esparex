export interface Transaction {
    id: string;
    userId: string | { _id: string; firstName?: string; lastName?: string; email?: string; name?: string; mobile?: string };
    amount: number;
    currency: string;
    status: 'INITIATED' | 'SUCCESS' | 'FAILED';
    description?: string;
    gatewayPaymentId?: string;
    gatewayOrderId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface FinanceStats {
    totalRevenue: number;
    todayRevenue: number;
    totalSales: number;
    thisMonthRevenue: number;
}
