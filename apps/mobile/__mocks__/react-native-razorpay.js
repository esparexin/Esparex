module.exports = {
  open: jest.fn().mockImplementation((options) => {
    return Promise.resolve({
      razorpay_payment_id: 'pay_mock123456789',
      razorpay_order_id: options.order_id || 'order_mock123456789',
      razorpay_signature: 'signature_mock123456789',
    });
  }),
};
