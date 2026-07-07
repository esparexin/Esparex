# CLEANUP-006B Recovery Audit

## Baseline Metrics
- **Verification Command**: `wc -l apps/web/src/components/auth/AuthForm.tsx`
- **Expected Current Size**: ~859 lines (actual current: 859 lines)
- **Post-Implementation Target**: < 400 lines (preferred < 350 lines)

## Current File Info
- **File**: [AuthForm.tsx](../../../apps/web/src/components/auth/AuthForm.tsx)


---

## 1. Hook Inventory
The hook footprint inside the monolithic `AuthForm` comprises:
1. `useAuth()`: Pulls authentication actions and session state (`login`, `logout`, `token`, `setOnboardingRequired`, `onboardingRequired`, `user`) from context.
2. `useMutation` (x3):
   - `requestVerificationCodeMutation`: Dispatches the OTP verification email request.
   - `verifyMutation`: Checks the OTP passcode.
   - `googleLoginMutation`: Validates Google ID tokens against the backend.
3. `useCallback` (x6):
   - `formatTime`: Converts seconds into MM:SS format.
   - `triggerRequestCooldown`: Handles request expiry calculation and updates local storage.
   - `triggerVerifyCooldown`: Handles verification attempts lockdown timer and updates local storage.
   - `startTimer`: Controls the 60-second retry countdown.
   - `handleGoogleCredentialResponse`: Relays the credentials callback.
   - `initializeGoogleSignIn`: Renders the GSI One Tap button.
4. `useRef` (x2):
   - `timerRef`: Tracks active interval instances for retry countdown.
   - `googleCallbackRef`: Holds dynamic reference callback handler for Google SSO client.
5. `useEffect` (x9):
   - Cooldown Storage Hydration (Mount)
   - Request Cooldown Countdown Timer
   - Verify Cooldown Countdown Timer
   - Cross-tab Storage Listener Sync
   - Auto-hydration of initialEmail input parameter
   - Onboarding state transition router
   - Focus management for interactive inputs on step transition
   - Timer cleanup (Unmount)
   - Google dynamic script injection and GSI listener mounting

---

## 2. State Inventory
Internal React hook states managed by `AuthForm.tsx`:
1. `requestCooldownRemaining` (`number`): Resend OTP cooldown timer.
2. `requestCooldownExpiry` (`number | null`): Unix timestamp when resend cooldown expires.
3. `verifyCooldownRemaining` (`number`): Temporary verification lockdown timer.
4. `verifyCooldownExpiry` (`number | null`): Unix timestamp when lockdown expires.
5. `email` (`string`): Captures entered user email address.
6. `otp` (`string`): Captures entered OTP passcode.
7. `step` (`'request' | 'verify' | 'onboard'`): Controls active screen view state.
8. `error` (`string`): Captures validation and API transaction failure messages.
9. `infoMessage` (`string`): Captures success confirmations.
10. `resendTimer` (`number`): 60-second countdown for the verification retry screen.

---

## 3. Mutation Inventory
React Query Mutation Hooks triggering service calls:
1. `requestVerificationCodeMutation`: Calls `publicRequestVerificationCode(email)`
   - On Success: Transitions step to `'verify'`, sets info message, starts retry timer.
   - On Error: Checks for rate limit. If blocked, sets request cooldown.
2. `verifyMutation`: Calls `publicVerifyVerificationCodeOrOTP({ otp, email })`
   - On Success: Invokes `login()`, checks onboarding requirements, redirects.
   - On Error: Sets verify cooldown if rate limit hit.
3. `googleLoginMutation`: Calls `publicGoogleLogin(idToken)`
   - On Success: Logs user in, redirects or prompts onboarding.
   - On Error: Displays authentication error block.

---

## 4. Side-Effect Inventory
1. **Local Storage Transitions**: Writes/Reads cooldown records (`mad_otp_request_cooldown_expiry`, `mad_otp_verify_cooldown_expiry`) to persist security blocks over tab/page refreshes.
2. **Window Events Listener**: Hooks into `'storage'` window events to coordinate cooldown states instantly across browser tabs.
3. **Google GSI SDK injection**: Programmatically loads script `'https://accounts.google.com/gsi/client'` on demand and manages global callback hook registry.
4. **Input Focus Lifecycle**: Runs setTimeout side-effects to move user cursor focus to appropriate input elements (`checkout-login-email`, `email`, `otp`, `firstName`) when screens swap.

---

## 5. Dependency Map
- **Local Context Utilities**:
  - [AuthProvider](../../../apps/web/src/providers/AuthProvider.tsx) (`useAuth`)
- **API Services**:
  - [public.service](../../../apps/web/src/lib/api/public.service.ts) (`publicRequestVerificationCode`, `publicVerifyVerificationCodeOrOTP`, `publicGoogleLogin`)
  - [client](../../../apps/web/src/lib/api/client.ts) (`extractApiError`)
- **Third-Party Helpers / Assets**:
  - [load-script-once](../../../apps/web/src/lib/utils/load-script-once.ts) (`loadScriptOnce`)
  - [google-identity](../../../apps/web/src/utils/google-identity.ts) (`initializeGoogleIdentity`, `setGoogleIdentityCallback`)
- **Validations (Workspace Package)**:
  - `@mad/validations` (`checkEmailSchema`, `verifyAuthSchema`, `normalizeOtp`)
  - [mapZodError](../../../apps/web/src/lib/validation/mapZodError.ts) (`mapZodErrorToFields`)
- **Shared Sub-forms**:
  - [ProfileCompletionForm](../../../apps/web/src/components/auth/ProfileCompletionForm.tsx)
- **UI Components**:
  - `@mad/ui` (`Button`)

---

## 6. Extraction Candidates
1. **`useOtpCooldowns.ts`**: Encapsulates 5 timers, mount/unmount effects, storage synchronization logic.
2. **`LoginForm.tsx`**: Isolated form rendering the email submit phase, Google One Tap buttons, and terms links.
3. **`OtpVerifyForm.tsx`**: Isolated form rendering the OTP input digits, resend cooldown buttons, and past verification validation logs.
