# Login Simplification Audit

This audit evaluates the current state of public authentication routes, user interface components, and copy within the **MAD Entertainment** codebase. Specifically, it reviews the readiness and necessity of the planned Login Simplification PR on the `feat/auth-login-simplification` branch, validating alignment with the passwordless strategy.

---

## Current State

### 1. Login Page Audit
- **File Path**: [login/page.tsx](../../../apps/web/src/app/(auth)/login/page.tsx)
- **UI Visibility Checklist**:
  - `Register`: **No** (not visible in the rendered UI)
  - `Sign Up`: **No** (not visible in the rendered UI)
  - `Create Account`: **No** (not visible in the rendered UI)
  - `Create your account`: **No** (not visible in the rendered UI)
  - `New User`: **No** (not visible in the rendered UI)
  - `Password Login`: **No** (not visible in the rendered UI)
- **Unified Presentation**: The login page presents only an input field for email and a Google OAuth entry point.
- **Exposed Magic-Link Copy**: Yes. Outdated and technical jargon ("Magic Link", "Login Link") is still heavily exposed in user-facing labels, success descriptions, and error notifications.
- **Lines and JSX Blocks containing exposed terminology**:
  - **Header description text** (lines 268–272):
    ```tsx
    <p className="text-text-muted text-sm leading-relaxed">
      {step === 'request'
        ? 'Sign in passwordlessly using Google or an Email Magic Link.'
        : `We've sent a verification link and passcode to your email.`}
    </p>
    ```
  - **Submit Button** (lines 307–315):
    ```tsx
    <Button
      type="submit"
      variant="primary"
      fullWidth
      className="py-3.5 rounded-xl font-bold tracking-wide shadow-lg shadow-accent-purple/20 hover:shadow-accent-purple/40 active:scale-95 transition-all duration-200"
      isLoading={requestMagicLinkMutation.isPending}
    >
      Send Login Link
    </Button>
    ```
  - **Resend Action Labels** (lines 384–397):
    ```tsx
    {resendTimer > 0 ? (
      <span className="text-text-muted/60">
        Resend link in <span className="font-semibold text-purple-300">{resendTimer}s</span>
      </span>
    ) : (
      <button
        type="button"
        onClick={() => requestMagicLinkMutation.mutate()}
        disabled={requestMagicLinkMutation.isPending}
        className="text-accent-purple hover:text-accent-purple-light font-semibold transition-colors duration-200 disabled:opacity-50"
      >
        Resend Link
      </button>
    )}
    ```
  - **System Notifications and Errors** (lines 113, 131, 161):
    ```typescript
    setError(apiErr.message || 'Failed to request login link. Please try again.'); // Line 113
    setError(apiErr.message || 'Invalid or expired credentials. Please request a new link.'); // Line 131
    setInfoMessage('Verifying magic login link...'); // Line 161
    ```

---

### 2. Registration Route Audit
- **File Path**: [register/page.tsx](../../../apps/web/src/app/(auth)/register/page.tsx) (deleted)
- **Current Behavior**:
  - The registration route is **technically reachable** because the page file exists in the Next.js filesystem structure.
  - The route is **highly broken and obsolete**:
    - The backend contains **no `/register` route**; only passwordless authentication endpoints exist.
    - The client-side form API service adapter (`publicRegister`) adaptively calls `/auth/magic-link`, which sends an email and does not return direct session tokens.
    - On submission, the form mutation attempts to call `login(data.token, data.user)` immediately, which results in `undefined` tokens and corrupt application state.
  - The registration page is **completely unlinked** from active user-facing navigation:
    - Zero references or links from the `Navbar` component.
    - Zero references or links from the `Footer` component.
    - Zero references or links from the `LoginPage` component.
    - The *only* external discovery point is in the sitemap.

---

### 3. Link Discovery Audit
- A comprehensive search of the frontend source code yielded the following links/references to `/register`:
  1. [sitemap.ts](../../../apps/web/src/app/sitemap.ts#L40) — Line 40: `url: \`${SITE_URL}/register\`,`
  2. [register/page.tsx](../../../apps/web/src/app/(auth)/register/page.tsx#L186) — Line 186: `<Link href="/login" ...>Sign in</Link>` (self-reference back to login) (deleted).
- **Result**: No active, visible, user-facing navigation components (headers, menus, call-to-actions) expose or route users to `/register`.

---

### 4. Sitemap Audit
- **File Path**: [sitemap.ts](../../../apps/web/src/app/sitemap.ts)
- **Findings**:
  - `/register` currently exists as a static sitemap entry in the `STATIC_ROUTES` array (lines 39–44).
  - **SEO & Discoverability Impact**: Keeping it indexed encourages search engines to crawl a non-functional, obsolete form page. Removing `/register` from the sitemap will immediately protect search indexing and stop crawler traffic to a dead page.
  - **Roadmap decision**: It should be excluded immediately.

---

## Recommendation

**Option B: Small UI-only simplification still required.**

While the large structural transition to passwordless logic is complete, there is a clear, low-risk UI-only simplification required to deliver a pristine user experience and protect the system's integrity before proceeding to the ticket retrieval portal.

### Exact Files and Proposed Changes

#### 1. Login Page Simplification
*File: [login/page.tsx](../../../apps/web/src/app/(auth)/login/page.tsx)*
- Refactor copy to replace technical magic-link jargon with modern passwordless terms:
  - **Line 113**: Change error from `'Failed to request login link.'` to `'Failed to send verification code. Please try again.'`
  - **Line 131**: Change error from `'Please request a new link.'` to `'Please request a new code.'`
  - **Line 161**: Change status message from `'Verifying magic login link...'` to `'Verifying credentials...'`
  - **Line 270**: Change instruction description from `'using Google or an Email Magic Link.'` to `'using Google or your Email Address.'`
  - **Line 314**: Change submit CTA from `'Send Login Link'` to `'Continue with Email'` (presents a cleaner, action-oriented button).
  - **Line 386**: Change countdown from `'Resend link in'` to `'Resend code in'`
  - **Line 395**: Change action link from `'Resend Link'` to `'Resend Code'`

#### 2. Registration Route Confinement (Graceful Redirect)
*File: [register/page.tsx](../../../apps/web/src/app/(auth)/register/page.tsx)* (deleted)
- Because constraints prohibit deleting files/routes directly, we should redirect any legacy incoming `/register` traffic to the unified `/login` page on the client side:
  ```typescript
  'use client';

  import { useRouter } from 'next/navigation';
  import { useEffect } from 'react';

  export default function RegisterPage() {
    const router = useRouter();

    useEffect(() => {
      router.replace('/login');
    }, [router]);

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-purple-300 text-sm animate-pulse">Redirecting to sign in...</div>
      </div>
    );
  }
  ```

#### 3. Sitemap Cleanliness
*File: [sitemap.ts](../../../apps/web/src/app/sitemap.ts)*
- **Lines 39–44**: Completely remove the `/register` entry from the static routes array to stop search engines from indexing this page.

---

## Validation

### Findings
1. Passwordless authentication is fully functional on the backend.
2. The registration route (`/register`) is obsolete and broken because passwordless credentials cannot be initialized via the legacy multi-field form.
3. User-facing text exposes technical "magic-link" terms instead of clean consumer terminology ("Continue with Email", "passcode").

### Evidence
- `publicRegister` in `public.service.ts` converts registration payloads into magic-link triggers, which do not return direct auth tokens, causing client-side crashes in `register/page.tsx`'s mutate callback.
- UI elements in `login/page.tsx` explicitly contain `'Send Login Link'` and `'Email Magic Link'`.

### Recommended Next PR
- **Branch**: `feat/auth-login-simplification`
- **PR Scope**: Standardize authentication terminology to modern standards, add a soft redirect on the `/register` page to `/login` to gracefully sun-down the form, and exclude `/register` from search engine indexing in `sitemap.ts`.

### Risk Assessment
- **Breaking API Changes**: **None.** No API endpoints, database structures, or core authentication flows are altered.
- **Route Deletion Risk**: **None.** Route files are retained in the repository, satisfying routing safety guidelines while securing the UX with a simple client-side redirect.
- **SEO/Crawler Impact**: **Highly Positive.** Prevents search engines from indexing a dead page and guides external/backlink traffic seamlessly to the secure login flow.
