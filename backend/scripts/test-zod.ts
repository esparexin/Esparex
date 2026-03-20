import { verifyOtpSchema } from '../src/validators/auth.validator';
try {
    const payload = { mobile: 9999999999, otp: 123456 };
    const res = verifyOtpSchema.parse(payload);
    console.log("Validated:", res);
} catch (e) {
    console.error("Validation failed:", e);
}
