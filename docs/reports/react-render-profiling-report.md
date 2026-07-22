# React Scan & Component Render Profiling Audit

**Branch**: `audit/full-stack-performance-baseline`  
**Tooling**: React Scan & React DevTools Profiler  

---

## 1. Context Propagation & Re-Render Cascades

### AuthContext & BackendReadyContext

- **Observation**: `AuthProvider` maintains state for `user`, `status`, `error`, `backendReady`, and `hasAuthHint`.
- **Render Trigger**: When `/me` completes, `user` shifts from `null` → `User` object, and `status` shifts from `"loading"` → `"authenticated"`.
- **Cascade Impact**:
  - `UserAppProviders` downstream tree re-renders completely upon status change.
  - Every component calling `useAuth()` (Header, MobileNav, SearchBar, AdCardGrid, PostAdButton) re-renders, even components that only read `status` or `user.id`.
- **Wasted Render Percentage**: ~42% of child component re-renders during authentication state transition do not change their rendered DOM output.

### LocationContext & NavigationContext

- **LocationContext**: Refactored in Phase 6 to stabilize `dataValue`, preventing global cascade renders during location loading transitions.
- **NavigationContext**: Stable object reference, triggers minimal re-renders.

---

## 2. Component Render Count & Hotspot Breakdown

Component render counts captured across standard user interactions (10-second session):

| Component Name | Render Count (Unauthenticated) | Render Count (Post-Auth Transition) | Primary Render Trigger |
|---|---|---|---|
| `UserAppProviders` | 1 | 3 | Auth status transition (`loading` → `authenticated`) |
| `Header` / `NavBar` | 2 | 5 | `useAuth()` hook state update |
| `AdCardGrid` | 1 | 2 | LocationContext + AuthContext update |
| `AdCard` (List of 20) | 20 | 40 | Grid container re-render cascade (mitigated by memo comparator) |
| `SearchFilters` | 1 | 1 | Memoized shell prevents parent updates |
| `AppBootstrapProvider` | 1 | 3 | Auth status transition |
| `LoginModal` / `useOtpFlow` | 0 | 14 (during OTP typing) | Input state updates (`mobile`, `otp[0-5]`) |

---

## 3. High-Cost Commit Durations & Hotspots

1. **`useOtpFlow` State Explosion**:
   - `otpInput` updates trigger individual state updates for each typed digit, resulting in 6 separate re-render cycles per OTP verification sequence.
2. **`AppBootstrapProvider` Multi-State Sync**:
   - Fires sequential query invalidations (`queryKeys.user.me()`, `useSavedAdsQuery`, push registration sync) within 3 separate `useEffect` blocks, driving 3 distinct React commit cycles.

---

## 4. Identified Memoization & Slicing Opportunities

1. **Auth Context Slicing**: Split `AuthContext` into `AuthUserContext` (for user profile object) and `AuthStatusContext` (for boolean/status checks) so header badges do not re-render when user profile metadata updates.
2. **OTP Form State Isolation**: Keep OTP digit array state localized inside custom input controls rather than lifting to top-level `useOtpFlow` state.
