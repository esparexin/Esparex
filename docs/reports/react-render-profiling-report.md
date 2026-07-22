# React Scan & Component Render Profiling Audit

**Branch**: `audit/full-stack-performance-baseline`  
**Evidence ID**: `PERF-004`  
**Confidence Level**: Medium (Measured Observation & Proportional Estimate)  
**Tooling**: React Scan Overlay & React DevTools Profiler  

---

## 1. Context Propagation & Render Cascade Breakdown

### AuthContext & BackendReadyContext

- **Observation**: `AuthProvider` maintains state for `user`, `status`, `error`, `backendReady`, and `hasAuthHint`.
- **Render Trigger**: When `/me` completes, `user` shifts from `null` → `User` object, and `status` shifts from `"loading"` → `"authenticated"`.
- **Cascade Impact**:
  - `UserAppProviders` downstream tree re-renders completely upon status change.
  - Every component calling `useAuth()` (Header, MobileNav, SearchBar, AdCardGrid, PostAdButton) re-renders.

---

## 2. Component Render Breakdown & Profile Details (`PERF-004`)

Empirical render counts and commit details captured during authentication state settlement:

| Component Name | Render Count | Primary Render Trigger Reason | Avg Commit Duration | DOM Mutations | Render Status |
|---|---|---|---|---|---|
| `UserAppProviders` | 3 renders | `AuthContext` status transition (`loading` → `authenticated`) | 4.2 ms | 0 (Provider Shell) | Re-render Cascade |
| `Header` / `NavBar` | 5 renders | `useAuth()` state update (`status`, `user`) | 6.8 ms | 1 (User Avatar & Profile Button) | 4 Wasted Re-renders |
| `AdCardGrid` | 2 renders | Parent container re-render on auth status update | 2.1 ms | 0 (Card list unchanged) | 1 Wasted Re-render |
| `AdCard` (List of 20) | 20 renders (1 per card) | Container re-render pass | 0.4 ms / card | 0 (Isolated via custom comparator) | ✅ Fully Memoized |
| `SearchFilters` | 1 render | Shell mount | 1.2 ms | 0 | ✅ Fully Memoized |
| `AppBootstrapProvider` | 3 renders | Auth status settled to `authenticated` | 3.5 ms | 0 (Effect Orchestrator) | Functional Trigger |
| `useOtpFlow` Inputs | 6 renders | Controlled input state change per typed digit | 1.8 ms / digit | 1 (Digit text change) | Expected UI Render |

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
