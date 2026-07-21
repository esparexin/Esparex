export interface PaymentGatewayPort {
    verifySignature(payload: string, signature: string, secret: string): boolean;
    fetchPayment(paymentId: string): Promise<any>;
    fetchOrder(orderId: string): Promise<any>;
    createOrder(amountPaise: number, currency: string, receiptId: string): Promise<any>;
}
