# Frontend Token Cleanup Audit

**Date:** 2026-05-30
**Status:** Audit & Implementation Plan Only (No code changes implemented)
**Branch:** `feat/frontend-token-cleanup`

---

## Executive Summary
This audit outlines the frontend dependencies on legacy magic-link URL tokens before complete removal. With the migration to the passwordless **OTP-only email template** complete, the frontend no longer receives or requires one-click magic-link redirection mechanisms.

The goal of this audit is to identify all frontend token query extraction, URL token parsing, `initialToken` prop pass-through, automatic verification mutations, and type dependencies in order to lay out a risk-free removal plan.

---

## PART 1 — LOGIN PAGE AUDIT
* **File Path:** [login/page.tsx](../../../apps/web/src/app/(auth)/login/page.tsx)

### 1. Code Identification
* **Token Query Extraction & URL Parsing:**
  Located inside `LoginPageContent` (Lines 8-9):
  ```typescript
  const searchParams = useSearchParams();
  const queryToken = searchParams.get('token');
  ```
  This retrieves the string representation of the `token` parameter directly from the current request URL's query parameters.

* **initialToken Usage:**
  Located in the JSX render tree (Line 28):
  ```tsx
  <AuthForm mode="login" initialToken={queryToken} />
  ```
  The extracted `queryToken` is passed directly down to the `AuthForm` component.

* **Automatic Login Flows:**
  The login page itself does not contain any local automatic sign-in handlers; it delegates the entire token verification lifecycle to the child `AuthForm` component by passing `initialToken`.

### 2. Analysis & Impact
* **Current Behavior:** Landing on `/login?token=abc` extracts the token string from the URL and forwards it to the `AuthForm` prop wrapper.
* **Dependencies:** Depends on the Next.js `useSearchParams` hook and the `initialToken` prop signature in `<AuthFormProps>`.
* **Removal Impact:** Extremely **LOW**. Removing these lines has zero impact on routing, styling, or hydration. The login page will strictly serve as the standard email form and Google OAuth entry point.

---

## PART 2 — AUTHFORM AUDIT
* **File Path:** [AuthForm.tsx](../../../apps/web/src/components/auth/AuthForm.tsx)

### 1. Code Identification
* **initialToken Prop:**
  Defined in `AuthFormProps` (Line 55) and destructured in the component signature (Line 58):
  ```typescript
  export interface AuthFormProps {
    mode: 'login' | 'wallet' | 'checkout';
    onSuccess?: (data: AuthResponse) => void;
    onGuestContinue?: () => void;
    className?: string;
    initialToken?: string | null;
  }
  ```

* **Token Verification Mutation:**
  Located inside `verifyMutation` (Lines 138-144):
  ```typescript
  const verifyMutation = useMutation<AuthResponse, Error, string>({
    mutationFn: (tokenOrOtp: string) =>
      publicVerifyMagicLinkOrOTP({
        token: tokenOrOtp.length > 6 ? tokenOrOtp : undefined,
        otp: tokenOrOtp.length === 6 ? tokenOrOtp : undefined,
        email: tokenOrOtp.length === 6 ? email : undefined,
      }),
  ```
  This is a shared mutation handler. If the length of the verification string is greater than 6 characters, it treats it as a magic-link token and leaves `otp`/`email` empty. If it is exactly 6 characters, it executes OTP verification.

* **Auto Verification Effects:**
  Located in a dedicated `useEffect` block (Lines 239-244):
  ```typescript
  useEffect(() => {
    if (initialToken) {
      setInfoMessage('Verifying sign-in...');
      verifyMutation.mutate(initialToken);
    }
  }, [initialToken, verifyMutation]);
  ```
  On component mount, if `initialToken` is present, it updates the visual state to "Verifying sign-in..." and triggers `verifyMutation` to authenticate immediately.

* **Token-specific UI Paths:**
  No custom token screens exist. The form utilizes the global info banner (`infoMessage`) and error alerts to output verification status.

### 2. Analysis & Impact
* **Current Behavior:** If `initialToken` is passed, the form skips the email entry screen, shows a spinner message, and immediately invokes the backend API.
* **Dependencies:** Depends on TanStack Query `useMutation`, standard `publicVerifyMagicLinkOrOTP` service, and the custom `VerifyMagicLinkOrOTPPayload` type.
* **Removal Impact:** **LOW**. Eliminating the auto-verification hook simplifies `verifyMutation` to strictly handle 6-digit OTP codes, eliminating length-based conditional checks and narrowing parameters to a clean structure.

---

## PART 3 — API CLIENT AUDIT
* **File Paths:**
  * [public.service.ts](../../../apps/web/src/lib/api/public.service.ts)
  * [auth.ts](../../../apps/web/src/types/auth.ts)

### 1. Code Identification
* **VerifyMagicLinkOrOTPPayload:**
  Located in `types/auth.ts` (Lines 19-23):
  ```typescript
  export interface VerifyMagicLinkOrOTPPayload {
    token?: string;
    otp?: string;
    email?: string;
  }
  ```

* **Token Payload Support:**
  Located in `public.service.ts` (Lines 255-258):
  ```typescript
  export async function publicVerifyMagicLinkOrOTP(payload: VerifyMagicLinkOrOTPPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<{ data: AuthResponse }>('/auth/verify', payload);
    return data.data;
  }
  ```

* **Shared OTP/Token Verification Structures:**
  Both magic-link tokens and OTP passcodes route through the identical HTTP client adapter `publicVerifyMagicLinkOrOTP` mapping to `POST /auth/verify`.

### 2. Analysis & Impact
* **Current Behavior:** The frontend type model marks `token`, `otp`, and `email` as optional parameters, relying on runtime validation to ensure either the token or the OTP tuple is populated.
* **Dependencies:** Backed by the server-side Express controller `/auth/verify` supporting split authentication criteria.
* **Removal Impact:** **NONE** to existing systems. The payload structure can be securely restricted to require only `otp` and `email` types, raising compile-time safety and preventing raw token transmissions.

---

## PART 4 — RISK ANALYSIS

### 1. What breaks if frontend token support is removed?
* **Legacy Inbox Link Redirection:** Clicking an old magic-link login mail (e.g. `https://mad.esparex.in/login?token=abc...`) will no longer auto-authenticate the user. The login page will load normally, but it will completely ignore the `?token` search query, showing the standard clean email prompt.
* **UX Impact:** Users must copy the 6-digit numeric passcode from their email manually and paste it into the OTP box. Given that the email template has already been updated to **OTP-only**, new sign-in flows will not encounter this issue since no magic link is sent.

### 2. Do old inbox links still work?
* **Frontend:** No. The frontend will ignore the parameters, rendering link clicks useless.
* **Backend:** Yes. The backend controller and model routes remain fully operational for backward compatibility. If a custom or legacy client calls `POST /auth/verify` with a valid `token`, it will authenticate normally.

### 3. Does backend compatibility remain intact?
* **Yes.** Since zero server-side route definitions, controller scripts, or database schemes are altered, the API contract is 100% backward compatible. Only the frontend client is simplified.

---

## PART 5 — IMPLEMENTATION PLAN

### 1. Exact Files and Changes

#### A. Login Page Simplification
*File: [login/page.tsx](../../../apps/web/src/app/(auth)/login/page.tsx)*
* Remove `useSearchParams` import and query parameter parsing.
* Remove `initialToken` prop from the `<AuthForm>` invocation.
* **Line-by-line Diff:**
  ```diff
  -import { useSearchParams } from 'next/navigation';
   import { Suspense } from 'react';
   import { AuthForm } from '@/components/auth/AuthForm';

   function LoginPageContent() {
  -  const searchParams = useSearchParams();
  -  const queryToken = searchParams.get('token');

     return (
       ...
  -          <AuthForm mode="login" initialToken={queryToken} />
  +          <AuthForm mode="login" />
       ...
  ```

#### B. AuthForm Cleanup
*File: [AuthForm.tsx](../../../apps/web/src/components/auth/AuthForm.tsx)*
* Remove `initialToken` parameter from component signature, destructured props, and interface definition.
* Remove `initialToken` `useEffect` auto-trigger block.
* Simplify `verifyMutation` payload composition to only pass `otp` and `email`.
* **Line-by-line Diff:**
  ```diff
   export interface AuthFormProps {
     mode: 'login' | 'wallet' | 'checkout';
     onSuccess?: (data: AuthResponse) => void;
     onGuestContinue?: () => void;
     className?: string;
  -  initialToken?: string | null;
   }

  -export function AuthForm({ mode, onSuccess, onGuestContinue, className = '', initialToken }: AuthFormProps) {
  +export function AuthForm({ mode, onSuccess, onGuestContinue, className = '' }: AuthFormProps) {
     const { login } = useAuth();
     ...
     const verifyMutation = useMutation<AuthResponse, Error, string>({
  -    mutationFn: (tokenOrOtp: string) =>
  -      publicVerifyMagicLinkOrOTP({
  -        token: tokenOrOtp.length > 6 ? tokenOrOtp : undefined,
  -        otp: tokenOrOtp.length === 6 ? tokenOrOtp : undefined,
  -        email: tokenOrOtp.length === 6 ? email : undefined,
  -      }),
  +    mutationFn: (otpCode: string) =>
  +      publicVerifyMagicLinkOrOTP({
  +        otp: otpCode,
  +        email: email,
  +      }),
       onSuccess: (data) => {
     ...
  -  useEffect(() => {
  -    if (initialToken) {
  -      setInfoMessage('Verifying sign-in...');
  -      verifyMutation.mutate(initialToken);
  -    }
  -  }, [initialToken, verifyMutation]);
  ```

#### C. Type Simplification
*File: [auth.ts](../../../apps/web/src/types/auth.ts)*
* Restrict `VerifyMagicLinkOrOTPPayload` to strictly enforce OTP-only verification fields.
* **Line-by-line Diff:**
  ```diff
   export interface VerifyMagicLinkOrOTPPayload {
  -  token?: string;
  -  otp?: string;
  -  email?: string;
  +  otp: string;
  +  email: string;
   }
  ```

---

### 2. Validation Plan
1. **Type checking:**
   Execute clean compilation scans to confirm no interface violations:
   ```bash
   pnpm --filter @mad/web type-check
   ```
2. **Build testing:**
   Trigger monorepo Next.js production builds:
   ```bash
   pnpm --filter @mad/web build
   ```
3. **Manual Flow check:**
   * Access `http://localhost:3000/login` -> input email -> receive 6-digit OTP -> submit -> login succeeds.
   * Access `http://localhost:3000/login?token=any_stale_token_string` -> confirm standard login screen renders cleanly without automatic API requests, errors, or logs.

---

### 3. Rollback Plan
To instantly restore standard magic-link token parsing, URL parameter hydration, and fallback length checks on the frontend, revert the modified files:
```bash
git restore apps/web/src/app/\(auth\)/login/page.tsx apps/web/src/components/auth/AuthForm.tsx apps/web/src/types/auth.ts
```
This is fully compatible with standard production database structures and maintains full system consistency.
