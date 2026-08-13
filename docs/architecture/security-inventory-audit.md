# Security Inventory & Architecture Audit

## Overview
This document provides a single, comprehensive security inventory generated during Phase 1 of the Enterprise Security Hardening program on branch `feat/security-enterprise-hardening`.

---

## 1. CodeQL & Dependabot Vulnerability Mapping

| Alert Category | CodeQL Alert IDs | Root Cause | Target SSOT / Resolution |
| --- | --- | --- | --- |
| **Network Security (SSRF & Open Redirects)** | #110, #104, #25, #26 | Unvalidated outbound requests (`fetch` in `ipLocate`) and raw `res.redirect()` calls. | Consolidate `ssrfGuard.ts` & `redirectValidator.ts` in `core/src/utils`. |
| **Express Security & Middleware** | #105, #131, #98, #108, #109 | Duplicate `/metrics` route registration, sub-optimal Helmet setup, inconsistent CSRF token check placement. | Enforce strict pipeline ordering in `backend/api/src/app.ts`. |
| **Validation Hardening (ReDoS & XSS)** | #34, #169, #7, #8, #9 | Dynamic `new RegExp(userInput)` without escaping; inline HTML string replacement without strict sanitization. | Use `escapeRegExp` from `core/src/utils/stringUtils.ts` everywhere. |
| **Database Query Hardening** | #44, #45, #67, #69, #150, #151, #152, #153 | Raw `Types.ObjectId.isValid` calls lacking regex taint barrier; unvalidated MongoDB query operator keys (`$ne`, `$gt`). | Use `isValidObjectId` from `idUtils.ts` and `stripMongoOperators` from `mongoQueryValidator.ts`. |
| **Logging & PII Exposure** | #111, #112 | `maskPII` in `logger.ts` bypassed in non-production environments (`NODE_ENV !== 'production'`). | Enforce strict PII masking across ALL environments in `core/src/utils/logger.ts`. |
| **API Security Review** | #167, #168 | Sensitive endpoints accepting query params instead of request body; missing authorization guards. | Enforce POST/PUT body payloads and strict auth/authz guards across routes. |

---

## 2. Security Middleware Order Audit (`backend/api/src/app.ts`)

### Current Order Flaws Discovered:
1. `app.get('/metrics', ...)` defined twice (lines 285-293 and lines 382-389).
2. Rate limiter (`globalLimiter`) mounted after CORS but before DB check gate.
3. CSRF token verification middleware mounted after route registrations in some controllers.

### Mandated Canonical Middleware Pipeline Order:
1. **CORS Configuration** (`cors(corsOptions)`) — Handles preflight headers & allowed origins.
2. **Helmet Security Headers** (`helmet(...)`) — Enforces HSTS, NoSniff, XSSFilter, Frameguard, ReferrerPolicy.
3. **Trace Context & Request ID** (`requestIdMiddleware`) — Establishes AsyncLocalStorage correlation context.
4. **Compression** (`compression()`) — Gzip response compression.
5. **Body Parsers** (`express.json`, `express.urlencoded`) — Payload parsing with strict 15mb limits.
6. **Cookie Parser** (`cookieParser()`) — Parses signed cookies for auth & CSRF.
7. **Global Rate Limiter** (`globalLimiter`) — Prevents DOS on all `/api/v1` routes.
8. **DB & Maintenance Gate** (`requireDb`, `maintenanceMiddleware`) — Fail-fast guard before DB ops.
9. **CSRF Protection** (`verifyCsrfToken`) — Double-submit cookie verification for state-changing requests.
10. **Application Routes** (`/api/v1/*`) — Feature domain controllers.
11. **Error Handlers** (`sentryErrorHandler`, `customErrorHandler`) — Centralized error contract enforcement.

---

## 3. Dependency Vulnerability Inventory (52 Audited Findings)

- **Critical**: `tar` (decompress/parse DoS via unlimited input).
- **High**: `tar` (arbitrary file read/write, path traversal, PAX size override), `handlebars` (RCE), `socket.io-parser` (memory leak).
- **Moderate**: `uuid` (missing buffer bounds check), `cross-spawn` (command injection on Windows), `cookie`, `express`, `path-to-regexp`.

Remediation Strategy: Root package `overrides` in `package.json` for transitive packages, ensuring zero duplicate dependency trees.
