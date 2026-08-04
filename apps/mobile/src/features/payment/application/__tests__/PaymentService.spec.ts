import { PaymentService } from '../PaymentService';
import { IPaymentRepository, PaymentSuccessResult } from '../IPaymentRepository';

describe('PaymentService', () => {
  let mockRepository: jest.Mocked<IPaymentRepository>;
  let service: PaymentService;

  beforeEach(() => {
    mockRepository = {
      getPlans: jest.fn(),
      createPaymentOrder: jest.fn(),
      verifyPayment: jest.fn(),
      openNativeCheckout: jest.fn(),
      getWalletSummary: jest.fn(),
      getTransactionHistory: jest.fn(),
    };
    service = new PaymentService(mockRepository);
  });

  it('delegates getPlans to repository', async () => {
    mockRepository.getPlans.mockResolvedValue([]);
    const plans = await service.getPlans();
    expect(plans).toEqual([]);
    expect(mockRepository.getPlans).toHaveBeenCalled();
  });

  it('delegates createPaymentOrder to repository', async () => {
    const order = { orderId: 'ord_123', keyId: 'rzp_key', amount: 499, currency: 'INR' };
    mockRepository.createPaymentOrder.mockResolvedValue(order);

    const result = await service.createPaymentOrder('plan_123');
    expect(result).toEqual(order);
    expect(mockRepository.createPaymentOrder).toHaveBeenCalledWith('plan_123');
  });

  it('processes checkout for standard paid order and verifies payment', async () => {
    const order = { orderId: 'ord_123', keyId: 'rzp_key', amount: 499, currency: 'INR' };
    const successResult: PaymentSuccessResult = {
      razorpay_payment_id: 'pay_123',
      razorpay_order_id: 'ord_123',
      razorpay_signature: 'sig_123',
    };

    mockRepository.createPaymentOrder.mockResolvedValue(order);
    mockRepository.openNativeCheckout.mockResolvedValue(successResult);
    mockRepository.verifyPayment.mockResolvedValue();

    const checkout = await service.processCheckout('plan_123');

    expect(mockRepository.createPaymentOrder).toHaveBeenCalledWith('plan_123');
    expect(mockRepository.openNativeCheckout).toHaveBeenCalledWith(order);
    expect(mockRepository.verifyPayment).toHaveBeenCalledWith({
      razorpayPaymentId: 'pay_123',
      razorpayOrderId: 'ord_123',
      razorpaySignature: 'sig_123',
    });
    expect(checkout).toEqual(successResult);
  });

  it('auto-fulfills zero-cost or mock order without calling native SDK', async () => {
    const order = { orderId: 'ord_free', keyId: 'rzp_key', amount: 0, currency: 'INR', status: 'SUCCESS' };
    mockRepository.createPaymentOrder.mockResolvedValue(order);

    const checkout = await service.processCheckout('plan_free');

    expect(mockRepository.createPaymentOrder).toHaveBeenCalledWith('plan_free');
    expect(mockRepository.openNativeCheckout).not.toHaveBeenCalled();
    expect(mockRepository.verifyPayment).not.toHaveBeenCalled();
    expect(checkout).toEqual({
      razorpay_payment_id: 'zero_cost_ord_free',
      razorpay_order_id: 'ord_free',
      razorpay_signature: 'auto_verified',
    });
  });
});
