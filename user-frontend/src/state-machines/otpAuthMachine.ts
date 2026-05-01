import { createMachine } from './createMachine';

export type OtpAuthState = "idle" | "sendingOtp" | "waitingForOtp" | "verifyingOtp" | "authenticated" | "error";
export type OtpAuthEvent = "SEND_OTP" | "OTP_SENT" | "VERIFY_OTP" | "SUCCESS" | "FAIL" | "RESET";

export const otpAuthMachine = createMachine<OtpAuthState, OtpAuthEvent>({
    initial: "idle",
    states: {
        idle: {
            on: { SEND_OTP: "sendingOtp" },
        },
        sendingOtp: {
            on: { OTP_SENT: "waitingForOtp", FAIL: "error" },
        },
        waitingForOtp: {
            on: { VERIFY_OTP: "verifyingOtp", SEND_OTP: "sendingOtp", RESET: "idle" },
        },
        verifyingOtp: {
            on: { SUCCESS: "authenticated", FAIL: "error" },
        },
        authenticated: {
            on: { RESET: "idle" },
        },
        error: {
            on: { RESET: "idle", SEND_OTP: "sendingOtp", VERIFY_OTP: "verifyingOtp" },
        },
    },
});
