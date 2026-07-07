# Authentication Duplication Report

## 1. Google SDK Initialization
* **Duplicate Location A**: [apps/web/src/app/(auth)/login/page.tsx:L161-185](../../apps/web/src/app/(auth)/login/page.tsx#L161-L185)
* **Duplicate Location B**: [apps/web/src/components/auth/AuthForm.tsx](../../apps/web/src/components/auth/AuthForm.tsx) (Consolidated target)
* **Reason**: Both pages load the Google Sign-in Identity script separately (using distinct loading mechanism: next/script vs loadScriptOnce) and initialize `google.accounts.id` from scratch. This leads to duplicate initialization logs and double-loading of buttons which triggers the `google.accounts.id.initialize() called multiple times` SDK runtime crash.
* **Consolidation Recommendation**: Extract the Google Identity initialization, client configuration, and button render logic into a single React Hook `useGoogleSignIn` or utility inside `apps/web/src/lib/hooks/use-google-signin.ts`. Share a global window ref `window.__googleSdkInitialized` to prevent double-initialization of the Google library.

---

## 2. Duplicate Login & Verification Flows
* **Duplicate Location A**: [apps/web/src/app/(auth)/login/page.tsx:L98-143](../../apps/web/src/app/(auth)/login/page.tsx#L98-L143)
* **Duplicate Location B**: [apps/web/src/components/auth/AuthForm.tsx](../../apps/web/src/components/auth/AuthForm.tsx) (Consolidated target)
* **Reason**: Both files duplicate identical TanStack Query mutation setups:
  * `requestMagicLinkMutation`
  * `verifyMutation`
  * `googleLoginMutation`
  In addition, they copy-paste OTP resend timer intervals, countdown state, and code validation functions.
* **Consolidation Recommendation**: Create a unified custom hook `useAuthFlow` that exposes standard email/OTP request mutations, resend timer countdown state, error states, and token login hooks. Reuse this hook in both the Login Page and the Checkout Authorization Card to ensure identical passcode handling.

---

## 3. Duplicate Session Token Handlers
* **Duplicate Location A**: [apps/web/src/app/(auth)/login/page.tsx:L121-124](../../apps/web/src/app/(auth)/login/page.tsx#L121-L124)
* **Duplicate Location B**: [apps/web/src/components/auth/AuthForm.tsx](../../apps/web/src/components/auth/AuthForm.tsx) (Consolidated target)
* **Reason**: Success callbacks inside both pages manually invoke `login(data.token, data.user)` and handle local navigation/redirection.
* **Consolidation Recommendation**: Centralize this logic inside the `login` function of the global `AuthProvider`.

---

## 4. Duplicate Cookie Management (Backend)
* **Duplicate Location A**: [apps/server/src/controllers/public/auth.controller.ts:L58-63](../../apps/server/src/controllers/public/auth.controller.ts#L58-L63) (inside `verifyMagicLinkOrOTP`)
* **Duplicate Location B**: [apps/server/src/controllers/public/auth.controller.ts:L92-97](../../apps/server/src/controllers/public/auth.controller.ts#L92-L97) (inside `loginWithGoogle`)
* **Duplicate Location C**: [apps/server/src/controllers/public/auth.controller.ts:L126-131](../../apps/server/src/controllers/public/auth.controller.ts#L126-L131) (inside `refresh`)
* **Reason**: The options used for setting the HttpOnly cookie `refreshToken` are copy-pasted across three routes:
  ```ts
  const isProd = getEnv().NODE_ENV === 'production';
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  ```
* **Consolidation Recommendation**: Write a helper utility function `setSessionCookie(res: Response, token: string)` in `apps/server/src/utils/cookie.ts` that encapsulates these identical parameters and invokes it across the controller endpoints.
