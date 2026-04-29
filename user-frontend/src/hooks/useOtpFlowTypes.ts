export type OtpEntryStep = "enterNameAndOtp" | "enterOtp";
export type AuthStep = "enterMobile" | OtpEntryStep | "locked";

export type AuthError =
    | { type: "invalid"; attemptsLeft?: number }
    | { type: "locked"; message: string }
    | { type: "blocked"; message: string }
    | { type: "generic"; message: string }
    | null;

export type RateLimitScope = "send" | "verify";

export type RateLimitState = {
    scope: RateLimitScope;
    message: string;
    untilMs: number;
};
