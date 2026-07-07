# Google Auth Regression Audit

## 1. Issue Overview
Google Login fails to work correctly in both the main login page and the checkout authorization container, showing errors in the browser console:
- `The given origin is not allowed for the given client ID`
- `google.accounts.id.initialize() called multiple times`

---

## 2. Root Cause & Detailed Investigation

### Multiple `initialize()` Calls & Script Loading Duplication
* **Root Cause**: Both `LoginPageContent` (`apps/web/src/app/(auth)/login/page.tsx`) and `CheckoutAuthCard` (`apps/web/src/components/booking/CheckoutAuthCard.tsx`) implement independent Google Identity Services SDK initialization logic. When both components load, they trigger separate calls to `google.accounts.id.initialize()` and `google.accounts.id.renderButton()`. In addition, `LoginPageContent` uses `next/script` while `CheckoutAuthCard` uses a custom `loadScriptOnce` utility.
* **Evidence**:
  * **Login Page (`apps/web/src/app/(auth)/login/page.tsx`)**:
    * Script loading:
      ```tsx
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogleSignIn}
      />
      ``` (Line 228-232)
    * `useEffect` Hook (Lines 188-193) triggers `initializeGoogleSignIn` on every state change when `step === 'request'`:
      ```tsx
      useEffect(() => {
        const googleObj = (window as unknown as { google?: GoogleIdentity }).google;
        if (typeof window !== 'undefined' && googleObj && step === 'request') {
          initializeGoogleSignIn();
        }
      }, [step, initializeGoogleSignIn]);
      ```
  * **Checkout Auth Card (`apps/web/src/components/booking/CheckoutAuthCard.tsx`)**:
    * Script loading and direct execution (Lines 169-185):
      ```tsx
      useEffect(() => {
        let active = true;
        const loadGsi = async () => {
          try {
            await loadScriptOnce('https://accounts.google.com/gsi/client');
            if (active && !isAuthenticated && step === 'request' && !isGuestBypassed) {
              initializeGoogleSignIn();
            }
          } catch (err) {
            console.error('Failed to load Google script in checkout auth:', err);
          }
        };
        loadGsi();
        return () => { active = false; };
      }, [isAuthenticated, step, isGuestBypassed, initializeGoogleSignIn]);
      ```
  * Calling `google.accounts.id.initialize()` multiple times is strictly forbidden by the Google SDK and throws the observed error.

### OAuth Origin Mismatch & Client ID Configuration
* **Root Cause**: The Google Client ID configured in the client `.env.local` file is `347286144875-r1qn4s5b00itbthjreppvoortrpqupst.apps.googleusercontent.com`.
  In production, the frontend resides at `https://mad.esparex.in`.
  The error `The given origin is not allowed for the given client ID` indicates that the origin `https://mad.esparex.in` (and potentially `https://madmin.esparex.in` or local development ports like `http://localhost:3000` if not registered) is **not added** to the "Authorized JavaScript Origins" in the Google Cloud Console for the OAuth 2.0 Client ID.
* **Evidence**:
  * The production environments run on Vercel (`https://mad.esparex.in` and `https://madmin.esparex.in`).
  * The Client ID in the web environment:
    * `apps/web/.env.local`: `NEXT_PUBLIC_GOOGLE_CLIENT_ID=347286144875-r1qn4s5b00itbthjreppvoortrpqupst.apps.googleusercontent.com` (Line 3)
  * The Client ID in the server environment:
    * `apps/server/.env`: `GOOGLE_CLIENT_ID=347286144875-r1qn4s5b00itbthjreppvoortrpqupst.apps.googleusercontent.com` (Line 64)

---

## 3. Affected Files
* **Frontend**:
  * [apps/web/src/app/(auth)/login/page.tsx](../../apps/web/src/app/(auth)/login/page.tsx)
  * [apps/web/src/components/auth/AuthForm.tsx](../../apps/web/src/components/auth/AuthForm.tsx)
  * [apps/web/.env.local](../../apps/web/.env.local) (deleted)
* **Backend**:
  * [apps/server/.env](../../apps/server/.env) (deleted)

---

## 4. Impact & Risk Assessment
* **Impact**: **HIGH**. Google Login is completely broken in production environments, resulting in immediate auth failure and error logs for any user attempting to log in via Google.
* **Risk Level**: **MEDIUM** (Broken feature, but fallback Magic Link/OTP authentication remains functional).

---

## 5. Recommended Fix & Action Plan
1. **Google Console Action (Infrastructure)**:
   * Access the Google Cloud Console for the registered project.
   * Navigate to **APIs & Services > Credentials** and edit the Web Client ID.
   * Add the following domains under **Authorized JavaScript Origins**:
     * `https://mad.esparex.in` (Production web app)
     * `https://madmin.esparex.in` (Production admin panel)
     * `http://localhost:3000` (Local dev app)
2. **Client-Side Refactoring (Consolidation)**:
   * Extract Google SDK loading and initialization logic into a unified custom hook or utility (e.g., `useGoogleIdentity`).
   * Track global SDK initialization state via a singleton flag (e.g., `window.__googleSdkInitialized = true`) to prevent calling `initialize()` multiple times.
   * Use the consolidated utility in both `LoginPageContent` and `CheckoutAuthCard`.
