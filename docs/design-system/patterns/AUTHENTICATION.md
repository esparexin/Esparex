---
id: UX-AUTH-001
title: Authentication Pattern
status: approved
priority: critical
pattern-version: 1.0.1
owner: Platform
since: "1.5.0"
last-reviewed: 2026-07-06
review-frequency: quarterly
related-journeys:
  - JRN-AUTH-001
related-patterns:
  - UX-AUTH-002
related-components:
  - Button
  - FormField
---

# UX-AUTH-001 — Authentication Pattern

## 1. Overview

The Authentication pattern covers the full identity verification flow for both end-user and admin surfaces. The web app uses a **passwordless OTP flow** (email → 6-digit code → optional profile onboarding). The admin portal uses a **email + password flow** with role validation. Both flows must implement standardized loading, error, and success states, and must manage focus programmatically on step transitions.

---

## 2. Applicable Surfaces

| Surface | Route | Notes |
|---|---|---|
| Web | `/login` (modal) | Rendered inside a `Modal` or drawer; triggered from nav or event checkout gate |
| Web | `/dashboard` | Destination after successful authentication |
| Admin | `/login` | Standalone page; email + password |
| Admin | `/dashboard` | Destination after successful admin authentication |

---

## 3. Source of Truth

```
apps/web/src/components/auth/AuthForm.tsx          — Orchestrator: manages step state machine
apps/web/src/components/auth/LoginForm.tsx         — Step 1: email entry + Google SSO
apps/web/src/components/auth/OtpVerifyForm.tsx     — Step 2: OTP entry and verification
apps/web/src/components/auth/ProfileCompletionForm.tsx — Step 3: first-time profile onboarding
apps/web/src/components/auth/hooks/useOtpCooldowns.ts  — Cooldown timer management
apps/admin/src/app/login/page.tsx                  — Admin email + password login
```

---

## 4. Evidence Reviewed

```
Source files (audited 2026-07-06):
  - apps/web/src/components/auth/AuthForm.tsx
  - apps/web/src/components/auth/LoginForm.tsx
  - apps/web/src/components/auth/OtpVerifyForm.tsx
  - apps/web/src/components/auth/ProfileCompletionForm.tsx
  - apps/admin/src/app/login/page.tsx

Shared packages:
  - packages/validations (checkEmailSchema, verifyAuthSchema, normalizeOtp, updateProfileSchema)
```

---

## 5. Shared Components Used

| Component | From | Purpose |
|---|---|---|
| `Button` | `@mad/ui` | Primary submit CTA on all web auth steps |
| `FormField` | `@mad/ui` | Standard label + input + error composition — not yet adopted by auth forms |

> [!NOTE]
> **Adoption Gap**: `FormField` exists in `@mad/ui` as a stable component, but neither the web auth forms nor the admin login page currently use it. All auth forms use raw `<label>` + `<input>` pairs with ad-hoc error placement. This is a **compliance gap**, not a missing component. It is documented here as evidence for the Phase 3.5 compliance audit.
>
> **Admin divergence**: The admin login page (`/login`) does not use any `@mad/ui` components — it uses a custom inline spinner and custom error div. This is a compliance gap documented in Phase 3.5.

---

## 6. State Diagram

### Web Authentication (Passwordless OTP)

```
Idle (request step)
 ↓ [submit email]
Requesting (OTP dispatch in flight)
 ├── [success] → OTP Pending (verify step)
 │                ↓ [submit 6-digit code]
 │               Verifying
 │                ├── [success, profile complete] → Authenticated → Dashboard
 │                ├── [success, profile incomplete] → Onboarding (onboard step)
 │                │                                   ↓ [submit profile]
 │                │                                  Saving Profile
 │                │                                   ├── [success] → Authenticated → Dashboard
 │                │                                   └── [error] → Onboarding (error shown)
 │                ├── [rate limited] → OTP Pending (verify cooldown active)
 │                └── [invalid code] → OTP Pending (error shown)
 └── [rate limited] → Idle (request cooldown active)
     [invalid email] → Idle (validation error shown)

Google SSO Path:
Idle → Google Handoff → Verifying Google Token
 ├── [success, profile complete] → Authenticated → Dashboard
 ├── [success, profile incomplete] → Onboarding
 └── [error] → Idle (error shown)
```

### Admin Authentication (Email + Password)

```
Idle
 ↓ [submit credentials]
Submitting
 ├── [success] → Authenticated → /dashboard
 └── [error] → Idle (error shown)
```

---

## 7. Required States

| State | Web | Admin | Description | Component |
|---|---|---|---|---|
| `idle` | ✅ | ✅ | Resting state — form ready for input | — |
| `loading` | ✅ | ✅ | Async operation in flight | `Button isLoading` prop (web); custom spinner (admin — gap) |
| `error` | ✅ | ✅ | API or validation error | Custom `role="alert"` div (both — gap: should use `ErrorState`) |
| `success` | ✅ | ✅ | Auth complete, redirect fired | — |
| `otp-pending` | ✅ | N/A | OTP sent, awaiting user input | `OtpVerifyForm` |
| `onboarding` | ✅ | N/A | New user must complete profile | `ProfileCompletionForm` |
| `cooldown` | ✅ | N/A | Rate limit active on OTP dispatch or verify | Timer display in `LoginForm` / `OtpVerifyForm` |

---

## 8. Optional States

| State | Description |
|---|---|
| `google-pending` | Google SSO token verification in flight |
| `profile-edit` | `ProfileCompletionForm` used in edit mode post-login |

---

## 9. Keyboard & Accessibility

### Focus Management
- **Web — step transitions**: On each step change (`request → verify → onboard`), focus moves programmatically to the first focusable input of the new step after a 50ms delay. IDs used: `email`, `otp`, `firstName`. This is implemented via `useEffect` + `document.getElementById` in `AuthForm.tsx`.
- **Admin**: No programmatic focus management — focus lands on the first field by default browser behavior.

### Keyboard Navigation
- All `Button` CTAs respond to `Enter` and `Space`.
- OTP field: `maxLength={6}`, `inputMode="numeric"`, `autoComplete="one-time-code"`, `enterKeyHint="done"`.
- Email field: `autoComplete="email"`.
- Password show/hide toggle: keyboard accessible via `aria-label="Show/Hide password"`.
- Back/edit links in web auth: minimum `44×44px` touch targets enforced via explicit class.

### ARIA
- Error messages rendered with `role="alert"` and `aria-live="assertive"` in all steps.
- Cooldown status messages rendered with `role="status"` and `aria-live="polite"` in `LoginForm`.
- Required fields in `ProfileCompletionForm` marked with `aria-required="true"` and visually with `*` + `<span class="sr-only">(required)</span>`.
- Mobile hint text linked via `aria-describedby`.

### WCAG AA Criteria
- **1.3.1 Info and Relationships**: Labels are programmatically associated via `htmlFor`/`id`.
- **1.4.3 Contrast**: Error text (`text-red-400`) and field focus ring (`accent-purple`) must meet 4.5:1 against background.
- **2.1.1 Keyboard**: All interactions operable via keyboard.
- **2.4.3 Focus Order**: Focus order follows visual reading order. Step transitions move focus logically.
- **4.1.3 Status Messages**: Dynamic feedback delivered via live regions.

---

## 10. Cross-Pattern Dependencies

| Pattern ID | Pattern Name | Relationship |
|---|---|---|
| `UX-AUTH-002` | OTP Verification | Sub-pattern for the verify step of web authentication |

---

## 11. Implementation Checklist

```
☐ Uses Button from @mad/ui for all primary CTAs
☐ Error messages use role="alert" and aria-live="assertive"
☐ Cooldown/status messages use role="status" and aria-live="polite"
☐ Focus moves programmatically on step transitions
☐ OTP input uses inputMode="numeric" and autoComplete="one-time-code"
☐ Email input uses autoComplete="email"
☐ All touch targets are minimum 44×44px
☐ Required fields marked with aria-required and sr-only text
☐ Loading state uses Button isLoading prop (not custom spinner)
☐ No local duplicate auth form implementation
☐ Validation uses shared schemas from @mad/validations
```

---

## 12. Governance Rules

#### Required
```
✓ Web auth must use Button from @mad/ui for primary CTAs
✓ Error messages must use role="alert" and aria-live="assertive"
✓ Focus must be managed programmatically on step transitions
✓ OTP input must include autoComplete="one-time-code" and inputMode="numeric"
✓ Shared validation schemas from @mad/validations must be used (no local schema duplication)
✓ OTP cooldown timer must be shown during rate-limit periods (never silently block)
✓ All interactive elements must have minimum 44×44px touch targets
```

#### Forbidden
```
✗ Custom spinner implementations — use Button isLoading prop
✗ Local Zod schema definitions for email or OTP — use @mad/validations
✗ window.alert() or window.confirm() for auth errors
✗ Silent failure on rate limit — cooldown state must always be communicated
✗ Auth logic in UI components — API calls belong in mutations or service layer
✗ Storing tokens in localStorage — token management belongs in AuthProvider
```

---

## 13. Design Decisions

| Decision | Record | Rationale Summary |
|---|---|---|
| Passwordless OTP for web users | ADR (to be linked) | Reduces friction for event attendees; eliminates password management |
| Email + password for admin | ADR (to be linked) | Admin accounts are provisioned; passwordless OTP would require email access for ops staff |
| OTP cooldown on both request and verify | Implementation evidence (`useOtpCooldowns`) | Prevents brute-force and spam without account lockout |
| Google SSO as secondary option | Implementation evidence (`LoginForm`) | Offers convenience without making it the primary path |

---

## 14. Backlog Gaps

No missing `@mad/ui` capabilities block this pattern.

**Compliance gaps (require Phase 3.5 audit — not backlog items):**
- Admin login does not use `@mad/ui` `Button` — uses a `motion.button` with inline styles.
- Admin login spinner is a custom animated `<div>` — not `Button isLoading`.
- Admin error message is a custom `motion.div` — not a standardized `ErrorState` usage.

These are documented here as evidence for the Phase 3.5 compliance matrix.

---

## 15. Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication — authored against existing web and admin implementations |
| 1.0.1 | 2026-07-06 | Corrected BL-004: `FormField` exists in `@mad/ui` (stable); finding reclassified as adoption/compliance gap |
