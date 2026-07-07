# Customer Conversion Funnel — Findings Validation Report

**Scope:** Findings #1, #5, #6
**Mode:** Read-only inspection — no code changes
**Date:** 2026-06-02

---

## Executive Summary

All three findings under review are valid and confirmed against current source code and server implementation. No finding was found to be stale, incorrect, or superseded.

### Validation Matrix

| Finding | Valid | Severity | Recommended Action |
|---|---|---|---|
| #1 — ₹Infinity Price Display | ✅ VALID | High | Proceed to implementation planning |
| #5 — Coupon Success Before Validation | ✅ VALID | Medium | Proceed to implementation planning |
| #6 — Guest Session Failure No Recovery | ✅ VALID | Medium | Proceed to implementation planning |

---

## Finding #1 — ₹Infinity Price Display

### Validation Result

**VALID**

### Evidence

**Location of defect:**
[EventsList.tsx L232](../../../apps/web/src/app/events/EventsList.tsx#L232)

```tsx
₹{Math.min(...event.ticketTiers.map((t) => t.price))}
```

**No length guard is present.** This is confirmed by direct inspection of the file.

**Confirmed: `ticketTiers` can be empty.**

The server-side Mongoose schema defines the field as:
```ts
// event.schema.ts L170
ticketTiers: { type: [ticketTierConfigSchema], default: [] },
```

`default: []` confirms that an event can exist in the database with a completely empty `ticketTiers` array. There is no server-side validation that requires at least one tier when publishing an event.

**Confirmed: The listing query does not filter out zero-tier events.**

`PublicEventService.listEvents()` in [event.service.ts L43–L52](../../../apps/server/src/services/public/event.service.ts#L43) applies only a `status: PUBLISHED` + `isDeleted: false` filter. No minimum tier count is enforced:

```ts
.select('title slug description category bannerImage startDate ticketTiers.price isSoldOut venue')
```

An event with `ticketTiers: []` will be returned by this query with `ticketTiers: []` in the payload.

**Confirmed: Additional soft-delete filtering exists only for the detail endpoint.**

`getEventBySlug()` at [event.service.ts L73–L75](../../../apps/server/src/services/public/event.service.ts#L73) filters `isDeleted` tiers post-query:

```ts
if (event.ticketTiers) {
  event.ticketTiers = event.ticketTiers.filter(tier => tier.isDeleted !== true);
}
```

This means even a published event with all tiers soft-deleted could produce `ticketTiers: []` on the detail endpoint as well. The listing endpoint performs no such filter — it passes the raw projected array directly.

**Confirmed: `Math.min(...[])` produces `Infinity` in JavaScript.**

```js
Math.min(...[]) // → Infinity
```

This is JavaScript specification behaviour. Spreading an empty array into `Math.min` produces `Infinity` because `Math.min()` with no arguments returns `Infinity` by definition.

**Confirmed: The `FeaturedEventsSection.tsx` correctly guards this case.**

[FeaturedEventsSection.tsx L287](../../../apps/web/src/components/ui/FeaturedEventsSection.tsx#L287):
```tsx
₹{event.ticketTiers && event.ticketTiers.length > 0
  ? Math.min(...event.ticketTiers.map((t) => t.price))
  : 0}
```

The guard exists in the homepage carousel but is **absent** from the `/events` listing grid.

**Confirmed: The type contract does not prevent this.**

`packages/types/src/index.ts L101`:
```ts
ticketTiers: TicketTierConfig[];
```

The TypeScript type is a plain array with no minimum length constraint. TypeScript alone cannot prevent this at runtime.

### Root Cause

`EventsList.tsx` performs an unchecked spread of `ticketTiers` into `Math.min()`. When an event is published with zero ticket tiers — which is a valid database state — the expression evaluates to `Infinity` and renders as `₹Infinity` in the price display. The `FeaturedEventsSection.tsx` component solved this identically but the fix was not applied consistently in `EventsList.tsx`.

### Business Impact

Any published event with an empty or fully-deleted `ticketTiers` array will display `₹Infinity` in the event listing grid. This is user-facing price corruption on the primary discovery page. Users seeing `₹Infinity` will lose trust in the platform and may abandon browsing. The event listing page is the top-of-funnel entry point for ticket purchases.

### Files Involved

| File | Role |
|---|---|
| [EventsList.tsx](../../../apps/web/src/app/events/EventsList.tsx) | Contains the unguarded `Math.min` expression at L232 |
| [event.service.ts](../../../apps/server/src/services/public/event.service.ts) | Confirms listing query returns empty-tier events |
| [event.schema.ts](../../../apps/server/src/models/event.schema.ts) | Confirms `ticketTiers` defaults to `[]` |
| [FeaturedEventsSection.tsx](../../../apps/web/src/components/ui/FeaturedEventsSection.tsx) | Reference: already contains the correct guard |

### Recommended Fix

Apply the same guard already present in `FeaturedEventsSection.tsx`:

```tsx
// EventsList.tsx L231–L233 — replace:
₹{Math.min(...event.ticketTiers.map((t) => t.price))}

// With:
₹{event.ticketTiers?.length > 0
  ? Math.min(...event.ticketTiers.map((t) => t.price))
  : 0}
```

Scope is a single line change in one file. No other components are affected.

### Regression Risk

**Minimal.** This is an additive guard. No existing behaviour changes for events with tiers. Events with zero tiers will display `₹0` instead of `₹Infinity`, which is a more appropriate fallback than a corrupted value.

---

## Finding #5 — Coupon Success Before Validation

### Validation Result

**VALID**

### Evidence

**Location of defect:**
[TicketSelectionContent.tsx L130–L137](../../../apps/web/src/components/booking/TicketSelectionContent.tsx#L130-L137)

```ts
const handleApplyCoupon = (e: React.FormEvent) => {
  e.preventDefault();
  if (!couponCode.trim()) return;
  setCouponApplied(true);         // ← state set immediately
  setCouponMessage(null);
  setShowCelebration(true);       // ← celebration fires immediately
  setError('');
};
```

**No API call is made in `handleApplyCoupon`.** The function sets `couponApplied = true` and fires `showCelebration = true` based solely on the condition that `couponCode.trim()` is non-empty. There is no backend validation at this step.

**Confirmed: Backend validation is deferred to booking submission.**

The coupon code is only transmitted to the server during `createBookingMutation.mutate()` at [L177–L181](../../../apps/web/src/components/booking/TicketSelectionContent.tsx#L177):

```ts
createBookingMutation.mutate({
  eventId,
  tickets: ticketsPayload,
  couponCode: couponApplied ? couponCode.trim() : undefined,
});
```

The server only sees the coupon code after the user:
1. Enters and "applies" a code (celebration fires)
2. Selects tickets
3. Proceeds through checkout form
4. Submits the "Place Order" form

**Confirmed: An invalid coupon triggers the full success celebration.**

The celebration modal at [L274–L312](../../../apps/web/src/components/booking/TicketSelectionContent.tsx#L274) renders:
- Full-screen overlay with backdrop blur
- Animated ping ring in emerald green
- Large checkmark icon
- "Coupon Applied! ✓" heading
- The entered code displayed
- An OK button

This fires for `INVALID123`, `EXPIRED`, `DOESNOTEXIST`, or any other arbitrary string.

**Confirmed: Failure path exists but fires much later.**

The `onError` handler in `createBookingMutation` at [L89–L100](../../../apps/web/src/components/booking/TicketSelectionContent.tsx#L89) includes:

```ts
if (apiError.toLowerCase().includes('coupon') || apiError.toLowerCase().includes('promo')) {
  setCouponApplied(false);
  setCouponMessage({ type: 'error', text: '⚠ Unable to apply promo code. Please check and try again.' });
}
```

This reverts the coupon state, but only after:
- The user has already seen "Coupon Applied! ✓"
- Proceeded through the entire checkout form
- Submitted payment details
- The booking creation API call has failed

The failure message at that point (`⚠ Unable to apply promo code`) is ambiguous — it does not tell the user whether the coupon was invalid, expired, or not applicable to this event.

**Confirmed: Customer pricing is never incorrectly calculated.**

No discount is applied on the client side. The coupon code is passed as a string to the server. If the server rejects it, the booking fails cleanly. There is no risk of a user paying a wrong amount — but there is a significant UX trust issue.

### Root Cause

The coupon UI was designed with an optimistic confirmation flow where the celebration is triggered client-side without any API call. The intent was to provide instant feedback. However, there is no deferred resolution path — the actual validation failure surfaces only at the final booking submission step, creating a false trust signal followed by a confusing late error.

### Business Impact

1. **False trust signal:** Users are shown a full-screen "Coupon Applied! ✓" celebration for invalid codes. When the booking eventually fails at submission, the user must diagnose what went wrong — there is no direct indication that the coupon was the cause unless the error message contains "coupon" or "promo".

2. **Conversion abandonment risk:** A user who enters an invalid coupon, sees the celebration, proceeds through the form, and then receives a booking error at the final step is likely to abandon. The frustration is amplified because the celebration made them believe the discount was secured.

3. **Support ticket risk:** Users who received the celebration modal and received a booking error may contact support claiming the system "accepted" their coupon but then rejected it.

### Files Involved

| File | Role |
|---|---|
| [TicketSelectionContent.tsx](../../../apps/web/src/components/booking/TicketSelectionContent.tsx) | Contains `handleApplyCoupon` (L130–L137), celebration modal (L274–L312), and deferred validation error (L89–L100) |

### Recommended Fix

Replace the optimistic celebration with an API-validated coupon check on "Apply":

```ts
const handleApplyCoupon = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!couponCode.trim()) return;

  // Validate against API before celebrating
  const result = await validateCouponCode(couponCode.trim(), eventId);

  if (result.valid) {
    setCouponApplied(true);
    setShowCelebration(true);
  } else {
    setCouponMessage({ type: 'error', text: result.message || 'Invalid or expired coupon code.' });
  }
};
```

If a `/coupons/validate` endpoint does not yet exist, an acceptable interim fix is to change the celebration messaging to set accurate expectations:

```tsx
// Instead of: "Coupon Applied! ✓"
// Use: "Code Saved — discount will be confirmed at checkout"
```

This removes the false positive while preserving the intent of immediate feedback.

### Regression Risk

**Low for the interim messaging approach.** Changing the celebration copy carries no functional risk.
**Medium for the API validation approach.** Requires a backend endpoint that validates coupon applicability for an event and quantity combination. Must handle the case where the endpoint itself fails (network error), so it cannot block checkout if unavailable.

---

## Finding #6 — Guest Session Failure Has No Recovery Path

### Validation Result

**VALID**

### Evidence

**Location of defect:**
[TicketSelectionContent.tsx L56–L73](../../../apps/web/src/components/booking/TicketSelectionContent.tsx#L56-L73)

```ts
useEffect(() => {
  let cancelled = false;

  ensureGuestBookingSession()
    .then((session) => {
      if (!cancelled) {
        setSessionToken(session.token);
      }
    })
    .catch(() => {
      if (!cancelled) {
        setError('Secure session initialization failed. Please refresh and try again.');
      }
    });

  return () => {
    cancelled = true;
  };
}, []);
```

**The `.catch()` block only calls `setError()`.** There is no:
- Retry button or retry function
- Support link
- Automatic retry with exponential backoff
- Alternative recovery path (e.g., "Sign in to continue")
- Navigation away from the blocked state

**Confirmed: The error renders as a generic banner.**

The error state at [L210–L214](../../../apps/web/src/components/booking/TicketSelectionContent.tsx#L210):

```tsx
{error && (
  <div className="p-3.5 bg-error/10 border border-error/30 rounded-xl text-xs text-red-400 text-center"
       role="alert" aria-live="assertive">
    {error}
  </div>
)}
```

The error is a static red banner with the message text. No action affordance is provided beyond reading the text. The only option the error text suggests is to "refresh" — a manual, unguided action.

**Confirmed: The failure blocks checkout entirely.**

`handleCheckoutSubmit` at [L169–L172](../../../apps/web/src/components/booking/TicketSelectionContent.tsx#L169) performs a secondary guard:

```ts
if (!sessionToken) {
  setError('Secure session initialization failed. Please refresh and try again.');
  return;
}
```

If `sessionToken` remains empty (which it will, because the session initialization failed), the user cannot submit a booking. The "Check out" button is functional but will immediately re-display this error. **The user is stuck.**

**Confirmed: `ensureGuestBookingSession()` depends on a server API call.**

[public.service.ts L60–L72](../../../apps/web/src/lib/api/public.service.ts#L60):

```ts
export async function ensureGuestBookingSession(): Promise<GuestBookingSession> {
  const existing = getStoredGuestBookingSession();
  if (existing) return existing;         // ← returns early from sessionStorage

  const session = await publicGetBookingSession();  // ← requires server call
  ...
  return session;
}
```

If `sessionStorage` does not have a valid session (first visit, cleared storage, incognito), the function calls `GET /bookings/session`. If that server call fails for any reason — network error, server overload, timeout, 5xx — the `.catch()` fires and the user is permanently blocked from booking.

**Confirmed: There is no retry mechanism anywhere in the component.**

A search for `ensureGuestBookingSession` in `TicketSelectionContent.tsx` returns only the single `useEffect` call on mount (L59). There is no second invocation, no retry handler, and no ref-based retry function exposed to the UI.

### Root Cause

The guest session initialization `useEffect` runs once on mount with no retry logic. The `.catch()` handler was implemented as a simple error setter without consideration for user recovery. Because the session is a prerequisite for booking creation, failure here creates an unrecoverable dead end within the ticket selection flow.

### Business Impact

1. **Complete booking abandonment:** Users who encounter a transient server error during session initialization cannot proceed to book tickets. They must manually refresh the page — if they do not see or understand the error, they may assume the site is broken and leave.

2. **Disproportionate impact during degraded availability:** If the `/bookings/session` endpoint is experiencing elevated error rates (e.g., server restart, deployment, overload), this manifests as a complete checkout blockage for affected users. No fallback degrades gracefully.

3. **Guest users are maximally affected:** Authenticated users are not confirmed to be exempt from this flow. The `ensureGuestBookingSession()` function runs for all users before checking auth state. Even if authenticated, a session token is obtained for the booking flow. Session failure affects all users, not only guests.

4. **Trust erosion:** The message "Secure session initialization failed" sounds severe to a non-technical user. Without recovery guidance, users may interpret this as a site-wide error rather than a transient failure that can be resolved with a simple retry.

### Files Involved

| File | Role |
|---|---|
| [TicketSelectionContent.tsx](../../../apps/web/src/components/booking/TicketSelectionContent.tsx) | Contains the session `useEffect` (L56–L74) and the blocked checkout guard (L169–L172) |
| [public.service.ts](../../../apps/web/src/lib/api/public.service.ts) | Contains `ensureGuestBookingSession()` (L60–L72) showing the API dependency |

### Recommended Fix

Add a stateful retry mechanism to the session initialization:

```tsx
// Add alongside existing error state:
const [sessionError, setSessionError] = useState(false);

const initSession = useCallback(() => {
  setSessionError(false);
  setError('');

  ensureGuestBookingSession()
    .then((session) => setSessionToken(session.token))
    .catch(() => {
      setSessionError(true);
      setError('Secure session initialization failed.');
    });
}, []);

useEffect(() => {
  initSession();
}, [initSession]);
```

Render a "Try Again" button when `sessionError` is true:

```tsx
{sessionError && (
  <button onClick={initSession} className="...">
    Try Again
  </button>
)}
```

This is the minimum viable fix. An enhanced version would include automatic retry with exponential backoff (1–2 retries before showing the error to the user).

### Regression Risk

**Low.** The fix is additive — it adds a `sessionError` flag and a retry call. The existing session initialization logic is not modified. The retry path calls `ensureGuestBookingSession()` again, which first checks `sessionStorage` before making a network call, so a second call in a recovered state is cheap and safe.

---

## Final Recommendation

**A. Proceed to implementation planning for all three findings.**

All three findings are validated as real, reproducible, and present in current production code:

- **Finding #1** is a single-line missing guard with minimal regression risk and direct user-facing price corruption impact.
- **Finding #5** is a UX trust issue that creates a false positive success signal and defers failure to the worst possible moment in the conversion funnel.
- **Finding #6** is a complete checkout blockage with no recovery path, disproportionately impactful during any period of backend degradation.

None of the three findings were found to be invalid, stale, or superseded by subsequent code changes.

---

*Validation completed by code inspection only. No files were modified.*
