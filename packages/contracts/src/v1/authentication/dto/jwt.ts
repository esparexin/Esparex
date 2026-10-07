/**
 * Phase 3a (§5) — canonical JWT claims payload.
 *
 * Relocated from `core/src/domains/identity/application/auth/auth.ts:16`
 * (DECISION-GATE §5; evidence `areas/04-contract-ssot.md` Finding 3 — unique
 * API payload with no contract home). This is the signed-token claims
 * contract shared between the core signer and the backend auth middleware.
 */
export interface JwtPayload {
    id: string;
    role: string;
    tokenVersion?: number;
    iat: number;
    exp: number;
    sub: string;
    jti?: string;
    iss?: string;
    aud?: string | string[];
}
