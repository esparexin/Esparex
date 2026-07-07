---
id: UX-AUTH-002
title: OTP Verification Pattern
status: approved
priority: critical
pattern-version: 1.0.0
owner: Platform
since: "1.5.0"
last-reviewed: 2026-07-06
review-frequency: quarterly
related-journeys:
  - JRN-AUTH-001
related-patterns:
  - UX-AUTH-001
  - UX-STATE-003
related-components:
  - Button
  - FormField
---

# UX-AUTH-002 — OTP Verification Pattern

## 1. Overview

The OTP Verification pattern covers the 6-digit passcode entry step within the web authentication flow. It is a sub-pattern of `UX-AUTH-001` (Authentication) and is rendered only on the passwordless web path — it does not apply to the admin portal. The pattern includes the input field, paste handling, submission, resend behavior, and two independent cooldown timers (request cooldown and verify cooldown).

---

## 2. Applicable Surfaces

| Surface | Route | Notes |
|---|---|---|
| Web | `/login` (modal, step 2) | Rendered inside `AuthForm` when `step === 'verify'` |

---

## 3. Source of Truth

```
apps/web/src/components/auth/OtpVerifyForm.tsx      — UI: input, submit, resend, cooldown display
apps/web/src/components/auth/AuthForm.tsx           — Orchestration: state machine, mutations
apps/web/src/components/auth/hooks/useOtpCooldowns.ts — Timer management
packages/validations/src/auth.ts                    — verifyAuthSchema, normalizeOtp
```

---

## 4. Evidence Reviewed

```
Source files (audited 2026-07-06):
  - apps/web/src/components/auth/OtpVerifyForm.tsx (157 lines)
  - apps/web/src/components/auth/AuthForm.tsx (322 lines) — verify mutation and error handling
  - apps/web/src/components/auth/hooks/useOtpCooldowns.ts

Shared packages:
  - packages/validations (verifyAuthSchema, normalizeOtp)
```

---

## 5. Shared Components Used

| Component | From | Purpose |
|---|---|---|
| `Button` | `@mad/ui` | "Verify Code" primary submit CTA |
| `FormField` | `@mad/ui` | Standard label + input + error composition — not yet adopted by OTP form |

> [!NOTE]
> **Adoption Gap**: `FormField` exists in `@mad/ui` as a stable component. The OTP form uses a raw `<label>` + `<input>` pair with manual error rendering. Adoption of `FormField` is a compliance gap for the Phase 3.5 audit, not a missing primitive.

---

## 6. State Diagram

```
OTP Pending (idle)
 ├── [user types] → OTP Pending (input updating, submit disabled if length < 6)
 ├── [paste] → OTP Pending (sanitized digits extracted, up to 6)
 ↓ [submit, length === 6]
Verifying (isPending = true, submit disabled)
 ├── [success, profile complete] → Authenticated (parent handles redirect)
 ├── [success, profile incomplete] → Onboarding step (parent handles transition)
 ├── [RATE_LIMIT_EXCEEDED] → OTP Pending (verify cooldown active, timer shown)
 │    ↓ [timer expires] → OTP Pending (idle, retries allowed)
 └── [invalid code] → OTP Pending (error shown inline)

Resend path:
OTP Pending (resendTimer > 0) → resend button disabled (timer shown)
OTP Pending (resendTimer === 0, no requestCooldown) → resend enabled
 ↓ [click resend]
Requesting new OTP (requestVerificationCodeIsPending = true)
 ├── [success] → OTP Pending (timer reset, otp input cleared)
 └── [RATE_LIMIT_EXCEEDED / OTP_COOLDOWN_ACTIVE] → OTP Pending (request cooldown active)
```

---

## 7. Required States

| State | Description | Implementation |
|---|---|---|
| `idle` | Awaiting user input; submit enabled only when 6 digits entered | `disabled={otp.length !== 6 \|\| isPending}` |
| `verifying` | API call in flight | `Button isLoading={isPending}` + submit disabled |
| `verify-cooldown` | Rate limit hit on verify — timer shown, retries blocked | `verifyCooldownRemaining > 0` guard |
| `request-cooldown` | Rate limit hit on OTP request — resend button shows timer | `requestCooldownRemaining > 0` guard |
| `resend-timer` | Initial cooldown after OTP is first sent | `resendTimer > 0` guard |
| `error` | Invalid code or unexpected API error | Inline `role="alert"` div below input |

---

## 8. Optional States

| State | Description |
|---|---|
| `paste-complete` | User pasted a code — input auto-populates sanitized digits |

---

## 9. Keyboard & Accessibility

### Focus Management
- On transition to the `verify` step, focus moves to the OTP input (`id="otp"`) after a 50ms delay (managed by parent `AuthForm`).

### Input Behavior
- `type="text"` with `inputMode="numeric"` and `pattern="[0-9]*"` — triggers numeric keyboard on mobile while allowing paste handling.
- `autoComplete="one-time-code"` — enables SMS autofill on supported devices (iOS Safari, Chrome Android).
- `maxLength={6}` — prevents input beyond 6 characters.
- `enterKeyHint="done"` — labels the mobile keyboard "done" key.
- Non-digit characters are stripped on `onChange`. On paste, `clipboardData` is sanitized to digits only, clamped to 6.

### ARIA
- Verify cooldown message: `role="alert"`, `aria-live="assertive"`.
- Validation error message: `role="alert"`, `aria-live="assertive"`.
- Resend button `aria-label` updates dynamically to communicate cooldown remaining time to screen readers (e.g., `"Resend verification code. Available in 0:45"`).
- Edit email button: `aria-label="Edit email address"`.

### Touch Targets
- "Verify Code" `Button`: full width — satisfies 44px minimum.
- "Resend Code" button: full width on the grid column — satisfies 44px minimum.
- "Edit" email button: explicitly sized to `min-h-[44px] min-w-[44px]`.

### WCAG AA Criteria
- **1.3.1**: Label associated via `htmlFor="otp"`.
- **1.4.3**: Error text (`text-red-500`) must meet 4.5:1 contrast.
- **2.1.1**: All controls keyboard operable.
- **4.1.3**: Dynamic error and cooldown messages delivered via assertive live region.

---

## 10. Cross-Pattern Dependencies

| Pattern ID | Pattern Name | Relationship |
|---|---|---|
| `UX-AUTH-001` | Authentication | Parent pattern — this is a sub-step within the web auth flow |
| `UX-STATE-003` | Error States | OTP errors are inline; verify cooldown uses inline alert, not full `ErrorState` |

---

## 11. Implementation Checklist

```
☐ OTP input uses type="text" inputMode="numeric" (NOT type="number")
☐ OTP input includes autoComplete="one-time-code"
☐ OTP input includes maxLength={6} and strips non-digits on change
☐ Paste handler sanitizes and clamps to 6 digits
☐ Submit disabled when otp.length < 6 or isPending
☐ Submit button uses Button isLoading prop (not custom spinner)
☐ Verify cooldown renders role="alert" aria-live="assertive"
☐ Resend button aria-label communicates cooldown time to screen readers
☐ Resend button disabled when resendTimer > 0 or requestCooldownRemaining > 0
☐ Edit email button has min 44×44px touch target
☐ OTP input cleared on resend
☐ normalizeOtp from @mad/validations used before API call
```

---

## 12. Governance Rules

#### Required
```
✓ OTP input must use type="text" with inputMode="numeric" — type="number" is prohibited
✓ OTP input must include autoComplete="one-time-code"
✓ Submit must be disabled until exactly 6 digits are entered
✓ Paste must be handled: strip non-digits, clamp to 6 characters
✓ Verify cooldown must be surfaced to the user with remaining time
✓ Resend cooldown must be surfaced with dynamic aria-label
✓ normalizeOtp from @mad/validations must be called before API submission
✓ Resend must clear the OTP input
```

#### Forbidden
```
✗ type="number" for OTP input — causes inconsistent behavior across browsers and strips leading zeros
✗ Silent suppression of rate limit errors — cooldown state must always be communicated
✗ Custom spinner instead of Button isLoading
✗ Local OTP validation schema — use verifyAuthSchema from @mad/validations
✗ Auto-submitting on 6th digit — submit must remain explicit (user presses button or Enter)
```

---

## 13. Design Decisions

| Decision | Record | Rationale Summary |
|---|---|---|
| `type="text"` not `type="number"` for OTP | Implementation evidence | `type="number"` has no `maxLength`, strips leading zeros, and triggers spinner controls on some browsers |
| No auto-submit on 6th digit | Implementation evidence | Explicit submit prevents accidental submission from paste operations |
| Two independent cooldown timers | `useOtpCooldowns` hook | `requestCooldown` prevents spam; `verifyTimer` prevents brute-force; they are separate concerns |
| Resend clears the OTP input | Implementation evidence | Prevents stale code from being submitted after resend |

---

## 14. Backlog Gaps

No missing `@mad/ui` capabilities block this pattern.

**Compliance gap (Phase 3.5 audit):** OTP label and input use raw HTML instead of the shared `FormField` composite. This is an adoption gap, not a missing component.

---

## 15. Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication — authored against `OtpVerifyForm.tsx` and `AuthForm.tsx` |
| 1.0.1 | 2026-07-06 | Corrected BL-004: `FormField` exists in `@mad/ui` (stable); reclassified as adoption/compliance gap |
