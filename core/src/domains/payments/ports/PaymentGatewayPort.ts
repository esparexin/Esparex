export interface GatewayOrderDTO {
    id: string;
    amount: number | string;
    currency: string;
    receipt?: string;
    status: string;
    [key: string]: unknown;
}

export interface GatewayPaymentDTO {
    id: string;
    order_id?: string;
    status: string;
    amount: number | string;
    currency: string;
    method?: string;
    captured?: boolean;
    error_code?: string | null;
    error_description?: string | null;
    [key: string]: unknown;
}

export interface PaymentGatewayPort {
    verifySignature(payload: string, signature: string, secret: string): boolean;
    fetchPayment(paymentId: string): Promise<GatewayPaymentDTO | null>;
    fetchOrder(orderId: string): Promise<GatewayOrderDTO | null>;
    createOrder(amountPaise: number, currency: string, receiptId: string): Promise<GatewayOrderDTO>;
}
