# Auth State Consistency Audit

## 1. Issue Overview
Users who log in successfully report a lack of visual indicators of their logged-in state, difficulty finding their user profile, and no way to log out from general pages.

---

## 2. Root Cause & Detailed Investigation

### Navbar Lack of Authentication Integration
* **Root Cause**: The global header Navbar (`apps/web/src/components/layout/Navbar.tsx`) is completely static with respect to authentication state. It does not import the `useAuth` hook and contains zero conditional rendering logic to check if a user session is active.
* **Evidence**:
  * In `Navbar.tsx` (Lines 86-100), the buttons are completely static:
    ```tsx
    <div className="hidden md:flex items-center gap-3">
      <Link
        href="/my-booking"
        className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
      >
        My Booking
      </Link>
      <Link
        href="/events"
        className="px-5 py-2.5 text-sm font-semibold btn-gradient text-white rounded-xl shadow-glow-sm hover:scale-[1.03] active:scale-95 transition-transform"
      >
        Book Now
      </Link>
    </div>
    ```
  * There is no user profile button, avatar icon, or logout button anywhere in the header navigation menu.

### Dashboard Auth State Enforcement
* **Root Cause**: The `/dashboard` route correctly uses `useAuth()` to check if a session is present and displays the user's name, email, booking history, and a sign-out button.
  However, because the Navbar only links to `/my-booking` (which is a guest/reference-based ticket view), the `/dashboard` route is highly undiscoverable.
* **Evidence**:
  * `UserDashboard` (`apps/web/src/app/(auth)/dashboard/page.tsx` line 15):
    `const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();`
  * If `isAuthenticated` is true, it displays their profile card.
  * In `Navbar.tsx` (Line 89 & 168), the link points to `/my-booking` instead of `/dashboard` when authenticated.

### Checkout Auth State and Guest Bypass Behavior
* **Root Cause**: The `CheckoutAuthCard` component behaves correctly: it checks `isAuthenticated` and renders a banner ("Signed in as [email]") with a "Sign out" link if logged in.
  However, if the user continues as a guest, the guest state is stored as a transient component-level boolean (`isGuestBypassed`) which does not sync to any global context, meaning guest status is lost if they navigate away or refresh.
* **Evidence**:
  * In `CheckoutAuthCard.tsx` (Lines 48, 56):
    ```tsx
    const { user, login, logout, isAuthenticated } = useAuth();
    const [isGuestBypassed, setIsGuestBypassed] = useState(false);
    ```

### Logout Visibility
* **Root Cause**: There is no global logout button. A user can only log out from either:
  1. The User Dashboard page (`/dashboard`), which they have to navigate to manually since it's not linked in the header.
  2. The Checkout page (`/checkout`), which is only active during active seat bookings.
* **Evidence**:
  * Header lacks `logout()` trigger.

---

## 3. Affected Files
* **Frontend Components**:
  * [apps/web/src/components/layout/Navbar.tsx](../../apps/web/src/components/layout/Navbar.tsx)
  * [apps/web/src/app/(auth)/dashboard/page.tsx](../../apps/web/src/app/(auth)/dashboard/page.tsx)
  * [apps/web/src/components/auth/AuthForm.tsx](../../apps/web/src/components/auth/AuthForm.tsx)

---

## 4. Impact & Risk Assessment
* **Impact**: **MEDIUM**. Confusing User Experience. Users who successfully authenticate are shown a "Book Now" and "My Booking" CTA, which makes them feel like their login attempt failed or was ignored. They have no way to log out or verify their profile from the homepage.
* **Risk Level**: **LOW** (UX annoyance, doesn't break booking APIs but damages brand perception).

---

## 5. Recommended Fix & Action Plan
1. **Integrate `useAuth` into Navbar**:
   * Modify `Navbar.tsx` to read the `useAuth()` context.
   * If `isAuthenticated` is `true`:
     * Display a dropdown with user details, a link to `/dashboard`, and a "Sign Out" button.
     * Replace the "My Booking" CTA in the header with a direct link to `/dashboard`.
   * If `isAuthenticated` is `false`:
     * Display a "Sign In" link next to "Book Now".
2. **Synchronize Logout Handler**:
   * Ensure that clicking "Sign Out" from the global Navbar handles session revocation and redirects the user to the homepage `/` or `/login` cleanly.
