# Finding Classification & Risk Mitigation TODO Dashboard

This interactive checklist tracks all findings, risks, pre-launch fixes, features, and the remediation roadmap for MAD Entertainment.

---

## 🚦 Risk Mitigation Dashboard (By Priority)

### 🔴 Critical Risks (Fix Immediately)
- [ ] **Booking TTL Deletion Webhook Race**
  - *Risk*: Physical deletion of booking records by MongoDB TTL races with payment confirmation webhooks (Orphaned charges, missing tickets).
  - *Mitigation/Action*: Implement logical expiration tracking and extend database TTL deletion to 30 days. Update payment services to confirm logically expired bookings.
- [ ] **Unsecured Diagnostic APIs**
  - *Risk*: Admin diagnostics API paths active without strict authentication middleware validation (Remote resource exposure).
  - *Mitigation/Action*: Secure `/api/admin/diagnostics/*` with Super Admin filters.
- [ ] **Missing DB Failover (MongoDB HA)**
  - *Risk*: Single database node without high-availability replica configurations (Complete platform outage).
  - *Mitigation/Action*: Deploy MongoDB High Availability replica set config.

### 🟠 High Risks (Fix Before Launch)
- [ ] **Static Header Navigation**
  - *Risk*: Authenticated users have no visual indication of active login sessions or sign-out options.
  - *Mitigation/Action*: Add `useAuth()` state hook to `Navbar.tsx` to display profile dropdowns and sign-out controls.
- [ ] **No Mobile Gate Offline Mode**
  - *Risk*: Venue network outages block ticket validation at the entrance gate.
  - *Mitigation/Action*: Cache validated ticket IDs locally on devices (offline scanner database caching).
- [ ] **Compliance DPDP Consent**
  - *Risk*: User identifiers and phone numbers collected without consent controls required by the India DPDP Act.
  - *Mitigation/Action*: Add explicit DPDP user consent checkboxes to checkout cards and registration forms.
- [ ] **Google SDK Multi-Initialization Crash**
  - *Risk*: Duplicate scripts in checkout and login pages can crash client browsers on reload.
  - *Mitigation/Action*: Set global window checks (`window.__googleSdkInitialized`) and unify under `useGoogleSignIn` / `useAuthFlow` hooks.
- [ ] **Axios Refresh Race Conditions**
  - *Risk*: Parallel failing 401 client calls trigger concurrent token rotations, leading to validation lockouts.
  - *Mitigation/Action*: Implement queuing / locking for parallel 401 requests during token refresh.

### 🟡 Medium Risks (Improve in 30 Days)
- [ ] **Dormant Artist Module**
  - *Risk*: Orphaned module bloats database schemas and routes.
  - *Mitigation/Action*: Delete dead artist schemas, controllers, and pages.
- [ ] **Dormant Venue Module**
  - *Risk*: Redundant CRUD routes and collections exist while events use raw strings.
  - *Mitigation/Action*: Delete dead venue schemas and clean admin sidebars.
- [ ] **No Direct Ticket PDF Download**
  - *Risk*: Guests cannot download ticket PDFs directly from lookup screens.
  - *Mitigation/Action*: Build `GET /bookings/:bookingId/download` streaming API.
- [ ] **Missing SEO JSON-LD Structured Data**
  - *Risk*: Event pages lack Event Schemas, blocking Google Event Search displays.
  - *Mitigation/Action*: Add Event structured data injection to event routing.
- [ ] **Missing Marketing Funnel Analytics**
  - *Risk*: Checkout flows lack conversion pixel hooks for marketing attribution.
  - *Mitigation/Action*: Integrate Google Tag Manager and Meta Conversions API.
- [ ] **Lack of Administrative Refund Controls**
  - *Risk*: Support team cannot issue gateway refunds via the admin panel.
  - *Mitigation/Action*: Build refund action buttons on admin dashboards.
- [ ] **Seating Map Usability on Mobile**
  - *Risk*: Zoom and pinch controls on canvas maps are not optimized, causing checkout friction.
  - *Mitigation/Action*: Adjust canvas map touch gesture handling for mobile.

### 🟢 Low Risks (Improve in 90 Days)
- [ ] **Lack of ARIA controls in Slider**
  - *Risk*: Accessibility compliance failure on homepages.
  - *Mitigation/Action*: Add proper ARIA roles, attributes, and keyboard navigation to sliders.
- [ ] **Lack of split-payment options**
  - *Risk*: Competitor gap for group bookings.
  - *Mitigation/Action*: Research and design split-payment flows.
- [ ] **No custom checkout upsells**
  - *Risk*: Lost revenue from VIP skip-the-line options.
  - *Mitigation/Action*: Introduce drink vouchers/VIP skip-the-line upsell choices in checkout flows.
- [ ] **Coupon Abuse Scenarios**
  - *Risk*: Lack of usage-per-user limits allows reuse of promotional codes.
  - *Mitigation/Action*: Add unique user usage limit checks to coupons.
- [ ] **No Calendar integration**
  - *Risk*: Unconfirmed event reminders on customer calendars.
  - *Mitigation/Action*: Add "Add to Calendar" widgets to booking success screens.

---

## 🚀 Top 20 Issues to Fix Before Launch
- [ ] **1. Logical EXPIRED booking status**: Stop MongoDB physical deletion of active checkout bookings (defer to 30 days).
- [ ] **2. Strict session check on Diagnostic routes**: Secure `/api/admin/diagnostics/*` with Super Admin filters.
- [ ] **3. Consolidate Google SDK script**: Implement unified `useGoogleSignIn` hook.
- [ ] **4. Navbar Authentication integration**: Add `useAuth()` state hook to `Navbar.tsx`.
- [ ] **5. Secure Webhook Endpoint raw-body handling**: Authenticate payload signatures before standard parsers.
- [ ] **6. Ticket PDF download route**: Build `GET /bookings/:bookingId/download` streaming API.
- [ ] **7. Axios client concurrency locking**: Queue parallel 401 requests during token refresh.
- [ ] **8. DPDP Consent Checkbox**: Add explicit user agreements to checkout cards.
- [ ] **9. Remove orphaned Artist module**: Delete dead schemas, controllers, and pages.
- [ ] **10. Remove orphaned Venue module**: Delete dead schemas and clean admin sidebars.
- [ ] **11. Ticket Resend Endpoint**: Add `/bookings/:bookingId/resend` with rate limiting.
- [ ] **12. Sentry alert notifications**: Route server DLQ errors directly to Slack.
- [ ] **13. Local scanner offline caching**: Cache validated ticket IDs locally on devices.
- [ ] **14. SEO JSON-LD Event markup**: Add Event structured data injection to event routing.
- [ ] **15. Dynamic convenience fees**: Expose variable administrative fees on pricing layouts.
- [ ] **16. Admin refund button**: Build refund action buttons on admin dashboards.
- [ ] **17. GSI multi-init guard**: Set global window checks for Google OAuth initializations.
- [ ] **18. Mobile form field viewports**: Adjust mobile layouts to prevent keyboard overlap on inputs.
- [ ] **19. Rate limit thresholds**: Calibrate payment route limits to block checkout brute-forcing.
- [ ] **20. Policy templates**: Replace policy, refund, and term placeholders with compliant legal drafts.

---

## 🌟 Top 20 Features to Build Next
- [ ] **1. F&B Pre-order Add-ons**: Offer drink vouchers during checkout.
- [ ] **2. VIP skip-the-line upsells**: Offer VIP entry passes during checkout.
- [ ] **3. Social Ticket Sharing**: Let users share booking layouts with friends.
- [ ] **4. Group Booking Discounts**: Add automatic discount triggers for group orders.
- [ ] **5. Multi-event season passes**: Bundle tickets for multiple event lineups.
- [ ] **6. Calendar Sync widgets**: Add "Add to Google Calendar" buttons to ticket screens.
- [ ] **7. Coupon usage limits**: Set maximum coupon uses per customer.
- [ ] **8. Loyalty point allocations**: Implement customer reward systems.
- [ ] **9. Push notifications**: Notify users of event changes via browser notifications.
- [ ] **10. Interactive seat reservation chats**: Real-time chat for group seat selections.
- [ ] **11. Event gate re-entry logs**: Track ticket checkout/re-entry events.
- [ ] **12. Event promoter dashboards**: Give external promoters access to ticket sales data.
- [ ] **13. SMS Ticket alerts**: Send booking receipts via Twilio SMS.
- [ ] **14. Customer referral codes**: Reward users for sharing event details.
- [ ] **15. Waitlist queues for sold-out events**: Let users sign up for sold-out tickets.
- [ ] **16. Apple Wallet ticket integration**: Export ticket passes directly to Apple Wallet.
- [ ] **17. Dynamic pricing triggers**: Automatically increase ticket prices as capacity limits decrease.
- [ ] **18. DJ operator bios & track previews**: Embed Spotify/SoundCloud players on DJ pages.
- [ ] **19. Admin operational logs**: Detailed logging of admin configuration changes.
- [ ] **20. Dark/Light theme switches**: Add manual UI theme toggles for frontend clients.

---

## 📅 Remediation & Release Roadmap

### 🏁 30-Day Plan (Stabilization)
Target Date: `2026-07-01` to `2026-08-01`
- [ ] **Resolve Webhook Race Condition**: Update `BookingService` and Mongoose parameters to implement logical expiration tracking (`logicalExpiresAt`) and extend database TTL deletion to 30 days. Update payment services to confirm logically expired bookings.
- [ ] **Integrate Navbar Session States**: Update the Next.js header `Navbar` to check the `useAuth()` context and display profile dropdowns and sign-out controls when logged in.
- [ ] **Consolidate Auth flows**: Unify Google One Tap script tags and TanStack mutations into unified hooks (`useGoogleSignIn` and `useAuthFlow`).
- [ ] **Purge Orphan Modules**: Clean up codebases by removing legacy Artist and Venue modules.
- [ ] **Build Ticket Download Route**: Expose the `GET /bookings/:bookingId/download` API to stream compiled PDF ticket buffers.

### 📈 90-Day Plan (Operational Scale)
Target Date: `2026-09-01` to `2026-10-01`
- [ ] **Optimize gate scanning operations**: Add service worker database storage mechanisms to mobile scanner interfaces for offline ticket check-ins.
- [ ] **Integrate Web checkout tracking pixels**: Connect Google Tag Manager and Meta Conversions APIs to record checkout funnels.
- [ ] **Build Admin Refund dashboard**: Implement gateway refund triggers inside the support admin panel.
- [ ] **Harden DPDP & GDPR compliance**: Build consent overlays and data deletion forms.

### 🚀 1-Year Product Roadmap
Target Date: `2026-11-01` to `2026-12-01`
- [ ] **Decouple background workers**: Separate queue workers from the Express API instance to deploy them as independent micro-services.
- [ ] **Introduce F&B pre-orders**: Expose checkout merchandise and drink package add-ons.
- [ ] **Implement SSO integrations**: Add SAML/OIDC compliance controls for enterprise venues.
- [ ] **Adopt dynamic pricing models**: Build pricing algorithms that adjust ticket prices based on real-time sales velocity and capacity.
