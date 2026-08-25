# Esparex Platform: Security Audit Remediation Report

## Date: 2026-08-25
## Status: Remediation Complete
## Branch: `fix/security-audit-remediation`

---

## 1. Executive Summary

This report documents the permanent remediation of all vulnerabilities and static code scanning findings identified in the **Esparex Platform: Code & Dependency Security Audit Report**.

### Vulnerability Deconstruction & Resolution
- **58 Dependabot Alerts**: Fully resolved across 9 unique packages (`tar`, `@xmldom/xmldom`, `postcss`, `sharp`, `image-size`, `nanoid`, `uuid`, `@opentelemetry/core`, `nodemailer`).
- **27 Multi-Lockfile Duplicate Alerts**: Eliminated by removing `apps/mobile/package-lock.json` and standardizing on the unified root monorepo `package-lock.json`.
- **CodeQL Static Code Analysis Findings**: 100% remediated across HTML sanitization, S3 URL validation, route rate limiting, and regex ReDoS prevention.

---

## 2. Dependency Vulnerability Remediations (DEP-01 – DEP-09)

| ID | Advisory / Finding | Root Cause | Remediation Action | Status |
|---|---|---|---|:---:|
| **DEP-01** | `tar` / `node-tar` Path Traversal & DoS | Unconstrained PAX parsing & hardlink traversal in node-tar < 7.4.3 | Pinned `"tar": ">=7.5.21"` in root package.json overrides | **RESOLVED** |
| **DEP-02** | `sharp` / Libvips Native Overflow | Integer overflows in pre-built libvips < 0.33.5 | Pinned `"sharp": "^0.34.5"` across core, backend/api, apps/web | **RESOLVED** |
| **DEP-03** | `nodemailer` Transport Bypass | Message-level `raw` option bypass | Updated direct dependencies to `"nodemailer": "^8.0.5"` | **RESOLVED** |
| **DEP-04** | `@xmldom/xmldom` Injection & DoS | Unescaped CDATA and recursion DoS in xmldom < 0.9.8 | Enforced override `"@xmldom/xmldom": ">=0.9.8"` | **RESOLVED** |
| **DEP-05** | `postcss` Path Traversal / DoS | `sourceMappingURL` traversal in postcss < 8.4.49 | Enforced override `"postcss": ">=8.4.49"` | **RESOLVED** |
| **DEP-06** | `image-size` Infinite Loop DoS | Unbounded while-loops on malformed headers < 1.2.0 | Enforced override `"image-size": ">=1.2.1"` | **RESOLVED** |
| **DEP-07** | `nanoid` Custom Generator Loop | Zero-size generator infinite loop in nanoid < 5.0.9 / 3.3.8 | Enforced override `"nanoid": ">=3.3.8"` (all workspaces on 3.3.16) | **RESOLVED** |
| **DEP-08** | `uuid` Missing Buffer Bounds | Missing buffer bounds check in uuid < 9.0.1 | Enforced override `"uuid": ">=11.1.1"` | **RESOLVED** |
| **DEP-09** | `@opentelemetry/core` Memory Leak | Unbounded W3C Baggage header parsing | Pinned telemetry dependencies to latest secure versions | **RESOLVED** |

---

## 3. Code-Level Security Hardening (CODE-01 – CODE-05)

### CODE-01: Strict HTML / Script Sanitization
- **Vulnerability**: Single-pass regex replacements (`val.replace(/<[^>]*>/g, '')`) in `core/src/validators/common.ts` and `core/src/validators/report.validator.ts` were vulnerable to nested tag reconstruction (e.g., `<<script>script>`).
- **Remediation**: Replaced regex with `sanitize-html` (`allowedTags: [], allowedAttributes: {}`). Added unit tests in `core/src/__tests__/validators/sanitization.spec.ts`.

### CODE-02: Strict S3 Hostname Matching & Domain Spoofing Guard
- **Vulnerability**: `hostname.includes('amazonaws.com')` substring check in `shared/src/listingUtils/imageUtils.ts` and `apps/web/src/lib/image/imageUrl.ts` allowed attacker domains (e.g., `attacker-amazonaws.com`).
- **Remediation**: Replaced with strict suffix and equality check (`hostname === 'amazonaws.com' || hostname.endsWith('.amazonaws.com')`). Added security unit tests in `apps/web/src/__tests__/imageUtils.security.test.ts`.

### CODE-03: Route Rate Limiting & Sensitive Endpoint Protection
- **Vulnerability**: Missing route-level limiters on sensitive auth and user mutation routes.
- **Remediation**:
  - Mounted `otpIpLimiter` and `otpSendLimiter` on `POST /api/v1/auth/cancel-otp`.
  - Mounted `searchLimiter` on `GET /me/wallet`, `GET /me/posting-balance`, `GET /me/transactions`, `GET /me/boosts`, and `GET /saved-ads`.
  - Mounted `mutationLimiter` and verified `protect` on `PATCH /me` and `DELETE /me`.
  - Added route middleware assertion tests in `backend/api/src/__tests__/routes/userAndAuthRoutes.security.spec.ts`.

### CODE-04: ReDoS Backtracking Elimination in Local OCR Classifier
- **Vulnerability**: Unanchored character classes in `LocalOcrProvider.ts` could experience catastrophic backtracking on adversarial input strings.
- **Remediation**: Replaced unanchored URL regex with bounded atomic regex (`/\b(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.(?:com|in|org|net|co|io|store|shop|app|biz)\b/gi`). Added ReDoS immunity tests in `LocalOcrProvider.spec.ts`.

### CODE-05: Static Code Analyzer Triage & Suppressions
- **CSRF Defense**: Verified Double-Submit Cookie pattern (`verifyCsrfToken` checking `x-csrf-token` header vs `esparex_csrf` cookie) across all state-changing HTTP methods.
- **S3 Probe**: Diagnostic script `backend/api/scripts/s3-probe.js` is excluded from production builds.

---

## 4. Verification & Quality Gates

All checks pass with 100% green status:
- ✅ `npm run type-check` (9 workspaces: 0 errors)
- ✅ `npm test` (Unit & integration test suites: 100% pass)
- ✅ `npm run repo:lockfile` (Root lockfile verified)
- ✅ `npm run guard:platform-governance` (0 architecture violations)
- ✅ Production build verified (`npm run build`)
