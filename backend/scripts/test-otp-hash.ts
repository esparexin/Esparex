import { config } from 'dotenv';
config();
import { generateSecureOtp } from '../src/utils/otpGenerator';
import { hashOtp, verifyOtpHash } from '../src/utils/otpSecurity';

console.log('--- OTP RUNTIME AUDIT ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('USE_DEFAULT_OTP:', process.env.USE_DEFAULT_OTP);
console.log('DEV_STATIC_OTP:', process.env.DEV_STATIC_OTP);

const generatedOtp = generateSecureOtp();
console.log('Generated OTP:', generatedOtp);

const hashed = hashOtp(generatedOtp);
console.log('Generated Hash length:', hashed.length);

const isVerified = verifyOtpHash(generatedOtp, hashed);
console.log('TimingSafeEqual passed validation:', isVerified);
