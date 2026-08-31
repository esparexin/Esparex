import {
    LoginPayloadSchema,
    VerifyOtpPayloadSchema,
    authMobileSchema,
} from '@esparex/contracts';

export const loginSchema = LoginPayloadSchema;
export const verifyOtpSchema = VerifyOtpPayloadSchema;
export { authMobileSchema as mobileSchema };

