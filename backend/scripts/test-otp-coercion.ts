import { verifyOtpSchema } from '../src/validators/auth.validator';
import { hashOtp, verifyOtpHash } from '../src/utils/otpSecurity';

console.log("--- 1. Testing Schema Types ---");
const passingString = verifyOtpSchema.parse({ mobile: "9999999999", otp: "123456" });
console.log("String Passed:", passingString.otp === "123456");

const passingNumber = verifyOtpSchema.parse({ mobile: "9999999999", otp: 123456 });
console.log("Number Passed:", passingNumber.otp === "123456");

try { verifyOtpSchema.parse({ mobile: "9999999999", otp: "123" }); console.log("Fail 1"); } catch(e) { console.log("Short format blocked."); }
try { verifyOtpSchema.parse({ mobile: "9999999999", otp: 123 }); console.log("Fail 2"); } catch(e) { console.log("Short number blocked."); }
try { verifyOtpSchema.parse({ mobile: "9999999999", otp: 1e6 }); console.log("Fail 3"); } catch(e) { console.log("1e6 blocked."); }
try { verifyOtpSchema.parse({ mobile: "9999999999", otp: NaN }); console.log("Fail 4"); } catch(e) { console.log("NaN blocked."); }
try { verifyOtpSchema.parse({ mobile: "9999999999", otp: null }); console.log("Fail 5"); } catch(e) { console.log("null blocked."); }

console.log("\n--- 2. Testing Hashing Surface ---");
const h1 = hashOtp(passingString.otp);
const h2 = hashOtp(passingNumber.otp);
console.log("Hashes match exactly:", h1 === h2 && h1.length === 64);
console.log("timingSafeEqual passes:", verifyOtpHash(passingNumber.otp, h1));
