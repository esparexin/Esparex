import type { User } from '../../identity/dto/user';

/**
 * Phase 3a (§5) — canonical auth response DTOs.
 *
 * Relocated from `apps/web/src/lib/api/auth.ts:6,19` (DECISION-GATE §5;
 * evidence `areas/04-contract-ssot.md` Finding 3 — unique API payloads with
 * no contract home). The auth client now imports these symbols; the tolerant
 * pre-normalization `AuthApiRawResponse` stays local to the client.
 */
export interface AuthPayloadFields {
    user?: User;
    token?: string;
    error?: string;
    message?: string;
    code?: string;
    isNewUser?: boolean;
    otpExpiresIn?: number;
    name?: string;
    attemptsLeft?: number;
    lockUntil?: string;
}

export interface AuthResponse extends AuthPayloadFields {
    success: boolean;
}
