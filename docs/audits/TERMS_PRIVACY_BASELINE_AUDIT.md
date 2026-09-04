# Esparex Terms & Privacy Policy Feature Baseline & Audit Report

**Date**: September 2026
**Status**: AUDITED — Baseline established for Feature Upgrade & Modernization
**Scope**: Mobile (`apps/mobile`), Web (`apps/web`), Backend (`backend/api`), Core (`core`), Shared (`packages/@esparex/shared`), Contracts (`@esparex/contracts`)

---

## 1. Executive Summary

An exhaustive audit of the Terms & Privacy Policy functionality was conducted across the Esparex monorepo ahead of the section 1.6 upgrade. The audit evaluated frontend UI/UX (Android & iOS), navigation mechanics, accessibility, design tokens, statutory compliance (IT Act 2000, Intermediary Guidelines Rules 2021, DPDP Act 2023, Indian Contract Act 1872), backend editorial API integration, and code hygiene.

---

## 2. Feature Inventory & Mapping

| Component / Layer | Location | Status | Current Role / Responsibility |
| :--- | :--- | :--- | :--- |
| **Mobile Screen** | `apps/mobile/.../TermsAndPrivacyScreen.tsx` | Active | Static presentation of 7 statutory legal clauses. |
| **Navigation Route** | `ROUTES.TERMS_AND_PRIVACY` (`routes.ts`) | Active | Registered in `AuthNavigator` and `ProfileNavigator`. |
| **Entry Points** | `LoginScreen.tsx`, `ProfileScreen.tsx` | Active | Links in login footer and profile settings menu. |
| **Web Pages** | `apps/web/src/app/(public)/terms/page.tsx` & `/privacy/page.tsx` | Active | Dedicated desktop/mobile web legal pages. |
| **Web Legal Constants** | `apps/web/src/lib/legal.ts` | Active (Isolated) | Contains company, grievance officer, and contact info. |
| **Backend API Route** | `backend/api/src/routes/editorialRoutes.ts` | Active | `/api/v1/editorial/:slug` and `/api/v1/editorial`. |
| **Backend Controller** | `backend/api/.../editorial.content.controller.ts` | Active | Dynamic editorial retrieval and admin updates. |
| **Core Model & Service**| `core/src/models/PageContent.ts` & `PageContentService.ts` | Active | MongoDB persistence for platform editorial copy. |
| **Shared Contracts** | `packages/contracts`, `@esparex/shared` | Deficient | No centralized legal constants; duplicate strings exist. |
| **Unit Test Coverage** | `apps/mobile` & `backend/api` | Missing | 0 tests for `TermsAndPrivacyScreen.tsx`; 0 tests for `editorial.content.controller.ts`. |

---

## 3. Detailed Audit Findings

### 3.1 Mobile UI/UX & Accessibility (Android & iOS)
- **Back Navigation Touch Target**: Current `<TouchableOpacity>` uses `p-1 mr-3` (~28×28px), violating WCAG 2.2 AA SC 2.5.8 (min 24×24px, recommended $\ge 44\times 44$px for touch surfaces).
- **Navigation Fragility**: Screen calls `navigation.goBack()` directly without checking `navigation.canGoBack()`. If accessed via deep links or when mounted at stack root, `goBack()` fails silently. Missing parent navigator fallback (`navigation.getParent()?.canGoBack()`) and fallback to `ROUTES.MAIN_STACK`.
- **Android Hardware Back**: No `BackHandler` listener registered, leading to inconsistent hardware back behavior on Android.
- **Cognitive Load & Readability**: All 7 statutory sections are currently rendered in a single scrollable card ("wall of text"). Users cannot filter or jump to specific topics (e.g. refund policy, privacy deletion, or safety rules).
- **Design Tokens**: Basic semantic tokens are used, but contrast and layout hierarchy need refinement to match `@esparex/design-tokens` standards.

### 3.2 Statutory Compliance (Indian Digital Regulations)
1. **Intermediary Status (Section 79, IT Act 2000 & Rule 3(1) of IT Rules 2021)**:
   - Present: Disclaimer of ownership, manufacturing, warranty, and custody of listed spare parts/electronics.
2. **User Eligibility (Indian Contract Act, 1872)**:
   - Present: Mandatory 18+ eligibility requirement and legal capacity.
3. **Safety & In-Person Inspection (Consumer Protection E-Commerce Rules 2020)**:
   - Present: Caution against advance wire transfers/courier deposits; mandate to physically test parts.
4. **Prohibited Goods & Conduct (Rule 3(1)(b), IT Rules 2021)**:
   - Present: Stolen goods, tampered IMEI/serial numbers, counterfeit OEM claims, FRP/iCloud unlock services.
5. **Paid Services & No-Refund Policy**:
   - Present: Non-refundable nature of spotlight promotions and featured ad packages once activated.
6. **Privacy & Account Erasure (DPDP Act 2023)**:
   - Present: OTP phone authentication, no data sale, right to erasure via Profile Settings > Delete Account.
7. **Statutory Grievance Redressal (Rule 3(2), IT Rules 2021)**:
   - Present: Grievance Officer details (Kalyan V Medaboina, Hyderabad, grievance@esparex.in, +91 9030787819, 24h ack / 15d disposal).
   - Defect: Contact information is purely static text without interactive `mailto:`, `tel:`, or official web URLs.

### 3.3 Legal Constants & SSOT Analysis
- Currently, `apps/web/src/lib/legal.ts` defines legal constants in isolation.
- `apps/mobile/src/features/user/presentation/screens/TermsAndPrivacyScreen.tsx` hardcodes duplicate strings for grievance officer name, email, phone, and timelines.
- Resolution: Move authoritative constants into `@esparex/shared/src/constants/legal.ts` and re-export via `@esparex/shared`. `apps/web` and `apps/mobile` will both consume this single source of truth.

### 3.4 Backend Editorial API & Data Flow
- `backend/api/src/routes/editorialRoutes.ts` exposes `GET /api/v1/editorial/:slug` and `PATCH /api/v1/editorial/:slug`.
- Legacy `PUT /api/v1/editorial/:slug` is already deprecated via `deprecateMethod('PATCH')` (returns 410 Gone).
- If the database collection `page_content` is unseeded, `getContentBySlug` returns empty content.
- Critical architectural requirement: Terms & Privacy on mobile must **always render offline** to guarantee uninterrupted statutory compliance and meet Apple App Store / Google Play review guidelines.

---

## 4. Dead, Legacy, Duplicate, and Orphaned Code Inventory

- **Dead/Zombie Files**: None found; existing screen and routes are actively linked in navigation and profile/auth views.
- **Duplicate Metadata**: Grievance officer details and legal entity text duplicated between `apps/web/src/lib/legal.ts` and `apps/mobile/.../TermsAndPrivacyScreen.tsx`.
- **Legacy Routes**: `PUT /api/v1/editorial/:slug` is handled by deprecation middleware.
- **Missing Tests**: 0 unit tests exist for mobile `TermsAndPrivacyScreen` and 0 unit tests for backend `editorial.content.controller`.

---

## 5. Upgrade Action Plan

1. **Phase 1**: Centralize legal constants in `@esparex/shared` and re-export in `apps/web/src/lib/legal.ts`.
2. **Phase 2**: Modernize `TermsAndPrivacyScreen.tsx` with $\ge 44$px touch targets, safe back navigation, Android `BackHandler`, segmented filters (`All`, `Terms of Service`, `Privacy Policy`, `Safety & Grievance`), and interactive grievance contact actions (`mailto:`, `tel:`, web link).
3. **Phase 3**: Create mobile unit tests in `apps/mobile/.../__tests__/TermsAndPrivacyScreen.spec.tsx`.
4. **Phase 4**: Create backend unit tests in `backend/api/.../__tests__/controllers/editorial.content.controller.spec.ts`.
5. **Phase 5 & 6**: Audit cleanup and code quality verification.
6. **Phase 7 & 8**: Update `TODO.md` and execute full monorepo build, test, and type-check verification.
