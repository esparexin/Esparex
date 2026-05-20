# Security Compliance & Fraud Prevention

Status: Active  
Effective Date: 2026-05-14  
Owner: Security Officer  
**Governance Layer:** Layer 3 (Implementation Truth) - Supplementary

## 1. Authentication & Sessions
1. **CSRF Protection:** The `CSRF_SECRET` must be set in production to protect all API mutation endpoints.
2. **Cookie Security:** Cookies must be strictly scoped to `.esparex.in` and use `Secure` and `HttpOnly` flags in production.
3. **Resilient Sessions:** Authentication checks must tolerate transient network errors (e.g. timeout). Only hard 401 or 403 responses should trigger a session logout.

## 2. API Security
1. **Authorization Checks:** All protected routes in `backend/user` must enforce granular role and permission checks. Admin wildcard `*` permissions must be fully supported.
2. **Data Sanitization:** Never trust client payload data. Strip hidden, internal, or non-permitted fields from incoming data bodies before processing.

## 3. Rate Limiting
1. **Redis Requirement:** Production environments strictly require Redis for rate-limiting (e.g., OTP flows, login brute-forcing). Fallback to in-memory is forbidden per SSOT.
