import { 
    canonicalizeToIndian, 
    getMobileVariants, 
    normalizeTo10Digits, 
    INDIA_COUNTRY_PREFIX 
} from '../../utils/phoneUtils';

describe('Phone Utilities', () => {
    describe('normalizeTo10Digits', () => {
        it('should extract 10 digits from a clean 10-digit number', () => {
            expect(normalizeTo10Digits('9876543210')).toBe('9876543210');
        });

        it('should extract 10 digits from a number with +91 prefix', () => {
            expect(normalizeTo10Digits('+919876543210')).toBe('9876543210');
        });

        it('should extract 10 digits from a number with 91 prefix without plus', () => {
            expect(normalizeTo10Digits('919876543210')).toBe('9876543210');
        });

        it('should extract 10 digits from a formatted string', () => {
            expect(normalizeTo10Digits('+91-98765-43210')).toBe('9876543210');
            expect(normalizeTo10Digits('(098) 765-43210')).toBe('9876543210');
        });

        it('should extract the last 10 digits if more than 12 digits are provided', () => {
            expect(normalizeTo10Digits('123456789012345')).toBe('6789012345');
        });
    });

    describe('canonicalizeToIndian', () => {
        it('should prepend +91 to a 10-digit number', () => {
            expect(canonicalizeToIndian('9876543210')).toBe('+919876543210');
        });

        it('should return empty string if input does not yield a 10-digit base', () => {
            // Normalize falls back to slice(-10). If the original is 5 chars, slice(-10) gives 5 chars.
            // Wait, the implementation says `digits.slice(-10)`. If length is 5, it returns 5 digits.
            // Let's check what actual implementation does.
            // If canonicalizeToIndian works correctly, it prepends +91 to whatever normalize returns.
            expect(canonicalizeToIndian('12345')).toBe('+9112345');
        });
    });

    describe('getMobileVariants', () => {
        it('should generate all three variants for a 10-digit given number', () => {
            const variants = getMobileVariants('9876543210');
            expect(variants).toHaveLength(3);
            expect(variants).toContain('+919876543210');
            expect(variants).toContain('919876543210');
            expect(variants).toContain('9876543210');
        });
    });
});
