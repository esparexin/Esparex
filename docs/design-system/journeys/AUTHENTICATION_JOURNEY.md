---
id: JRN-AUTH-001
title: Authentication Journey
status: approved
pattern-version: 1.0.0
owner: Platform
since: "1.5.0"
last-reviewed: 2026-07-06
review-frequency: quarterly
related-patterns:
  - UX-AUTH-001
  - UX-AUTH-002
  - UX-STATE-003
  - UX-STATE-004
---

# JRN-AUTH-001 — Authentication Journey

## Overview

The Authentication Journey maps the complete path a user takes from an unauthenticated state to a fully authenticated session with a complete profile. It covers both the web (passwordless OTP) and admin (email + password) surfaces.

A "journey" connects individual patterns into a coherent end-to-end flow. It shows how patterns hand off between each other, where errors can occur, and what the user's goal is at each stage.

---

## Web Authentication Journey

### User Goal
Access a gated feature (ticket purchase, dashboard, account) or respond to an auth gate triggered during checkout.

### Journey Map

```
[Entry Points]
  ├── Nav "Sign In" button
  ├── Checkout auth gate (user attempts booking without session)
  └── Direct route to /dashboard (redirect to login modal)

        ↓

[Step 1 — Email Entry]  ←  Pattern: UX-AUTH-001
  User enters email address
  System validates format (checkEmailSchema)
  System dispatches OTP via email API

  Errors:
  ├── Invalid format → inline validation error, stay on step 1
  ├── Rate limited (OTP_COOLDOWN_ACTIVE) → cooldown timer shown, stay on step 1
  └── API failure → error message shown, stay on step 1

  Alt path: Google SSO button → skip to Token Verification ↓

        ↓

[Step 2 — OTP Verification]  ←  Pattern: UX-AUTH-002
  User enters 6-digit code from email
  System verifies code and issues session token

  Errors:
  ├── Invalid code → inline error, stay on step 2
  ├── Rate limited (RATE_LIMIT_EXCEEDED) → verify cooldown timer, stay on step 2
  └── Expired code → error shown; user can request new code (resend)

  Resend path:
  └── User clicks "Resend Code" → new OTP dispatched → timer reset → step 2 continues

        ↓

[Decision — Profile Complete?]  ←  Pattern: UX-AUTH-001
  ├── Yes (onboardingRequired === false) → Session established → Success ↓
  └── No (onboardingRequired === true) → Step 3 ↓

        ↓

[Step 3 — Profile Completion]  ←  Pattern: UX-AUTH-001
  User enters first name, last name, optional mobile number
  System updates profile and clears onboarding flag

  Errors:
  ├── Validation error → inline error, stay on step 3
  └── API failure → error message shown, stay on step 3

  Cancel:
  └── "Cancel and Log Out" → session cleared → return to step 1

        ↓

[Success — Authenticated]  ←  Pattern: UX-STATE-004
  onSuccess callback fires
  Modal closes / redirect fires
  User lands on intended destination (dashboard, checkout continuation, etc.)
```

---

## Admin Authentication Journey

### User Goal
Access the admin portal to manage events, bookings, users, or other platform operations.

### Journey Map

```
[Entry Point]
  └── Navigate to /login (or redirect from any protected admin route)

        ↓

[Step 1 — Email + Password]  ←  Pattern: UX-AUTH-001 (admin variant)
  Admin enters email and password
  System validates credentials via admin auth API
  System issues admin session token with role

  Errors:
  ├── Empty fields → inline validation error, stay on step 1
  └── Invalid credentials / API error → error banner shown, stay on step 1

        ↓

[Success — Admin Session Established]
  router.replace('/dashboard')
  Admin lands on dashboard
```

---

## Divergence Summary

| Aspect | Web | Admin |
|---|---|---|
| Auth method | Passwordless OTP + Google SSO | Email + password |
| Steps | 2–3 (email → OTP → optional onboarding) | 1 |
| `@mad/ui` Button | ✅ Used | ❌ Not used (compliance gap) |
| Loading state | Button `isLoading` prop | Custom inline spinner (compliance gap) |
| Error state | Custom `role="alert"` div | Custom `motion.div` (compliance gap) |
| Focus management | Programmatic per-step | Browser default |
| Rate limiting | Dual cooldown (request + verify) | None |

> [!NOTE]
> The admin compliance gaps listed above are evidence for the Phase 3.5 UX Compliance Matrix. They do not block this pattern from being published as `approved` — they are expected outputs of the audit process.

---

## Pattern Handoff Points

| From | To | Trigger |
|---|---|---|
| `UX-AUTH-001` step 1 | `UX-AUTH-002` | Email submitted, OTP dispatched successfully |
| `UX-AUTH-002` | `UX-AUTH-001` step 3 | OTP verified, `onboardingRequired === true` |
| `UX-AUTH-001` step 2 or 3 | `UX-STATE-004` | Authentication complete, `onSuccess` callback fires |
| Any step | `UX-STATE-003` | API error surfaced to user |

---

## Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication |
