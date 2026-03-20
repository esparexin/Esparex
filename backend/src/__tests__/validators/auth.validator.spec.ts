import { verifyOtpSchema, loginSchema } from '../../validators/auth.validator';

describe('Auth Validation Schemas', () => {
    
    // Store original env
    const originalEnv = process.env.NODE_ENV;

    afterAll(() => {
        process.env.NODE_ENV = originalEnv;
    });

    describe('Development Environment (relaxed)', () => {
        beforeAll(() => {
            process.env.NODE_ENV = 'development';
        });

        it('should allow valid Indian numbers', () => {
            const result = loginSchema.safeParse({ mobile: '9876543210' });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.mobile).toBe('9876543210');
            }
        });

        it('should allow non-Indian 10-digit test numbers', () => {
            const result = loginSchema.safeParse({ mobile: '1234567890' });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.mobile).toBe('1234567890');
            }
        });

        it('should normalize +91 prefixes correctly', () => {
            const result = loginSchema.safeParse({ mobile: '+91 12345 67890' });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.mobile).toBe('1234567890');
            }
        });

        it('should fail if less than 10 digits', () => {
            const result = loginSchema.safeParse({ mobile: '123456789' });
            expect(result.success).toBe(false);
        });
    });

    describe('Verify OTP strictness removal', () => {
        it('should passively ignore extra fields in verify-otp payload', () => {
            const payload = {
                mobile: '1234567890',
                otp: '123456',
                extraMetadata: 'shouldNotThrowError'
            };

            const result = verifyOtpSchema.safeParse(payload);
            expect(result.success).toBe(true);
            
            // Should strip extra fields gracefully
            if (result.success) {
                expect((result.data as any).extraMetadata).toBeUndefined();
                expect(result.data.mobile).toBe('1234567890');
                expect(result.data.otp).toBe('123456');
            }
        });

        it('should coerce numeric OTP to string', () => {
            // Testing the val => string transform
            const payload = {
                mobile: '1234567890',
                otp: 123456
            };
            const result = verifyOtpSchema.safeParse(payload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.otp).toBe('123456');
            }
        });
    });
});
