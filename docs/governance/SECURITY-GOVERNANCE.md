# Security Governance Manual (`SECURITY-GOVERNANCE.md`)

> **Status:** Enforced · **Owner:** Security owner (ARB) · Evidence: Vol-2 §26, Vol-4 §40C, Vol-5 §51/52 · Baseline: 0 secrets in repo, TruffleHog+CodeQL clean

---

## 1. Authentication

| Surface | Standard |
| --- | --- |
| Passwords | bcrypt (cost 10) — never plaintext (`core/src/domains/identity/.../auth.ts`) |
| OTP | HMAC-hashed at rest (`otpSecurity`), expiry enforced, abuse-signal |
| Provider | **prod must be `msg91`** — `OTP_PROVIDER=test` in render.yaml is a launch blocker (F51, critical) |
| Sessions | JWT RS pairs, blacklist cache for logout, cookie security flags (httpOnly/secure/sameSite=lax) |
| CSRF | web+admin ✅ cookie-based; **mobile command CSRF missing — Wave 0 (F02)** |

## 2. Authorization

- Route guards: `protect` + `extractUser` + role checks (admin, verified-business, seller) — 95 guarded routes; new routes MUST add guards.
- Verify-before-downgrade: no silent permission drops (authorization-governance-guide.md in architecture docs).
- Admin: admin JWT separate; admin-only controllers guarded by admin middleware.

## 3. Secrets

- `.env*` gitignored; secrets injected via platform (Render `sync:false`) — dashboard values never committed.
- No secrets in logs/metrics (audit: 0 leaks found).
- Rotation: JWT/OTP secrets annually, or on compromise; HMAC dev fallback only under non-prod (`env.ts` guard).

## 4. Encryption

- In transit: HTTPS everywhere (Render/Vercel), SMTP TLS enforced, Redis TLS warning guard (`redis.ts:195`), Atlas TLS.
- At rest: passwords+OTP hashed; field-level encryption **not implemented** — review for PII expansion (Wave 5, GDPR).

## 5. OWASP ASVS mapping (spot positions)

| ASVS area | Status | Note |
| --- | --- | --- |
| V2 Auth | 🟠 | OTP provider gate (F51); mobile auth stubbed (F01) |
| V3 Session | ✅ | JWT + blacklist |
| V5 Validation | ✅ | zod everywhere; sanitize inputs |
| V6 Crypto | ✅ | bcrypt, HMAC, TLS |
| V7 Errors | 🟠 | 429 envelope drift (F48) |
| V8/9 Data | 🟠 | no GDPR export/delete (F49); residency undeclared |
| V12 File | 🟠 | upload presign routing (F03 Wave 0); 4MiB image guard |
| V14 Config | ✅ | env-driven; NODE_ENV gates |
| V13 API | ✅ | rate limiting global+per-route |

## 6. Headers & rate limiting

- Security headers: helmet optional — currently minimal (`vercel.json` configs); Wave 4 add CSP (report-only → enforce).
- Rate limiting: global limiter + auth limiter + mutation limiter; 429 must use envelope.

## 7. Logging & monitoring

- Security events (login success/fail, OTP abuse, admin actions, payment webhook verify) logged with `requestId`.
- Alerts: Sentry + `reliabilityAlerts` for 5xx & queue failures; SIEM-style export = future (Wave 5).

## 8. Vulnerability management

| Priority | Window |
| --- | --- |
| CRITICAL | ≤ 48h |
| HIGH | ≤ 7d |
| MEDIUM | ≤ 30d |
| LOW | next sprint |

Scanning: `repo:secret` nightly, CodeQL workflow, dependabot weekly, `guard:license` allowlist. New vendors: vendor risk assessment (Vol-5 §52) before integration.

---

*Owner: Security; gates: repo:secret, CodeQL, guard:license; linked: quality-gates GATE-001.*