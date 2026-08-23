# Esparex Mobile UI/UX Root Cause Audit & Verification Report

**Status**: CLOSED — All findings resolved. Preserved as regression evidence for future debugging reference.
**Date**: August 2026
**Scope**: apps/mobile vs apps/web

## 1. Executive Summary

A comprehensive audit was performed across the networking, image handling, and layout layers of the Esparex Android application. The investigation identified critical mismatches between the mobile implementation and the backend API contracts, as well as structural layout bugs affecting performance and accessibility. 

As of this report, all critical root causes have been resolved, and the mobile application now aligns with the platform's Governance Standards (AGENTS.md).

## 2. Android vs Web Architecture Comparison

| Aspect | Web (Next.js) | Android (Expo/RN) | Resolution Status |
| :--- | :--- | :--- | :--- |
| **API Base Path** | `/api/v1` | `/api` | **FIXED** (Aligned to /api/v1) |
| **Base Port (Local)** | `5001` | `3000` | **FIXED** (Aligned to 5001) |
| **Styling** | Tailwind (Native) | NativeWind v4 | **STABILIZED** |
| **Data Flow** | DTO -> UI | DTO -> Mapper -> Domain -> UI | **SIMPLIFIED** |
| **Logic Source** | Backend Contracts | Local Mappers/Services | **SYNCED** |

## 3. Network & API Root Cause Analysis

- **Issue**: Mobile was targeting the root `/api` endpoint while the backend and web specifically used `/api/v1`. This led to versioning drift and reliance on legacy redirects.
- **Root Cause**: `EXPO_PUBLIC_API_URL` omiting the version path and `apiClient.ts` having a hardcoded fallback to `localhost:3000`.
- **Resolution**: Refactored `apiClient.ts` to dynamically resolve the base URL using `API_V1_BASE_PATH` from `@esparex/shared`. Added safety checks for trailing slashes and port consistency.

## 4. Image Loading Root Cause Analysis

- **Issue**: 100% failure rate for local upload images on Android devices.
- **Root Cause**: `normalizeImageUrl` extracted only the origin (e.g., `https://api.esparex.in`) and appended `/uploads/...`. The backend serves these files under the versioned path `/api/v1/uploads/...`.
- **Resolution**: Updated the normalization utility to include the shared versioned base path. Images now resolve correctly across all environments.

## 5. Scrolling & Layout Performance

- **Issue**: "Jumpy" scrolling and item disappearance in `MarketplaceScreen`.
- **Root Cause 1**: Nested `ScrollView` + `FlatList` in the loading state caused layout measurement conflicts.
- **Root Cause 2**: `removeClippedSubviews={true}` on Android caused aggressive unmounting of items with dynamic heights.
- **Root Cause 3**: Flex chain break in the `Screen` component prevented `FlatList` from occupying the full viewport.
- **Resolution**: Flattened the scroll hierarchy. Standardized on `FlatList` for both loading (skeleton) and data states. Restricted `removeClippedSubviews` to production Android builds with optimized `windowSize`.

## 6. Accessibility & WCAG Verification

- **Touch Targets**: Increased header action buttons from 18px to **44x44dp** to meet WCAG 2.2 AA standards.
- **States**: Added `accessibilityState` to all filter chips (Sort, Condition, Price) to announce selection status to TalkBack.
- **Announcements**: Corrected `ListingCard` grouping to prevent "wall of text" screen reader announcements.

## 7. Native Android Source Audit

A deep audit of the `android/` directory was performed to identify unnecessary custom native code.

### Native Evidence Table

| File | Origin | Role | Runtime Required | Safe to Remove? |
| :--- | :--- | :--- | :--- | :--- |
| `MainActivity.kt` | Expo Prebuild | Activity Entry Point | Yes | **NO** |
| `MainApplication.kt` | Expo Prebuild | Application Config | Yes | **NO** |
| `PackageList.java` | RN Autolink | Module Registry | Yes | **NO** |
| `AndroidManifest.xml` | Expo Prebuild | Manifest | Yes | **NO** |

**Finding**: No custom Kotlin or Java implementations exist. The native layer is 100% standard Expo/React Native boilerplate. Deleting any of these files would break the build process.

## 8. Implementation Verification Tracking

1.  **Phase 1 (Network)**: [DONE] Corrected `apiClient.ts` to use `API_V1_BASE_PATH` from `@esparex/shared`.
2.  **Phase 2 (Images)**: [DONE] Fixed `normalizeImageUrl` to correctly handle versioned upload paths.
3.  **Phase 3 (Layout)**: [DONE] Refactored `MarketplaceScreen` to remove nested scroll views and fix `flex: 1` propagation.
4.  **Phase 4 (A11y)**: [DONE] Standardized touch targets (44dp) and added `accessibilityState` to interaction chips.

## 9. Final Recommendations

1.  **Contract-First Migration**: Remove local models only when they duplicate API contracts without adding domain meaning or behavior. This prevents presentation-layer coupling to backend transport structures.
2.  **Token Governance**: Enforce the use of `@esparex/design-tokens` for all elevations and shadows to ensure mobile-web visual parity.
3.  **No Native Policy**: Maintain the current "Zero Custom Native" status. Any new native requirements should be implemented via Expo Config Plugins to keep the `android/` directory ephemeral and reproducible.

---

## 9. Integration & Accessibility Post-Fix Report

*This section was previously maintained as `docs/audits/MOBILE_INTEGRATION_ACCESSIBILITY_REPORT.md`. Consolidated here per DOCUMENTATION-GOVERNANCE §7 anti-sprawl policy (August 2026).*

**Status**: COMPLETED

### 9.1 Integrated Features & Navigation Routes
The following screens were successfully integrated into the navigation tree and UI entry points:

- **Notifications**: Integrated into `MainStack` with live badge synchronization in `MarketplaceScreen`.
- **My Listings**: Integrated into `ProfileStack` with entry point in `ProfileScreen`.
- **Plans & Wallet Dashboard**: Integrated into `ProfileStack`. Added "Buy Credits" CTA linking to Plan Selection.
- **Terms & Privacy**: Integrated into `ProfileStack`. Added entry point in `SettingsScreen` under "About & Legal".
- **Deep Linking**: Synchronized `NotificationNavigationResolver` to correctly target the `NOTIFICATIONS` route.

### 9.2 Accessibility Audit (WCAG 2.2 AA)
Mandatory accessibility attributes were applied to all modified and newly integrated touchpoints:

| Screen | Refactor Actions |
| :--- | :--- |
| **NotificationScreen** | Added `accessibilityRole="button"`, `accessibilityLabel` for time-relative notifications. |
| **MyListingsScreen** | Added `accessibilityState` for listing status and descriptive labels for action buttons. |
| **PlansWalletDashboard** | Implemented summary roles and descriptive labels for credit balances and promotion status. |
| **PlanSelectionScreen** | Added detailed package descriptions and price labels for screen readers. |
| **TransactionHistory** | Itemized transactions with clear date, amount, and status announcements. |
| **Common Components** | `ActionBar`, `ImageCarousel`, and `FilterModal` refactored for focus management and labels. |

### 9.3 Engineering Fixes
- **Compilation**: Resolved "Unexpected token" syntax error in `PlansWalletDashboardScreen.tsx`.
- **Navigation**: Fixed incorrect navigation target in `NotificationNavigationResolver` that caused deep-link failures.
- **UI Logic**: Connected "Buy Credits" button in Wallet Dashboard to `PlanSelectionScreen` to complete the monetization loop.

### 9.4 Success Criteria Verification
- [x] **Fully operable via screen readers**: Verified `accessibilityLabel` and `accessibilityRole`.
- [x] **No orphaned functional screens**: All registered screens are reachable via UI.
- [x] **Navigation Consistency**: All screens include proper back buttons or header navigation.
- [x] **Platform Governance**: Complies with `AGENTS.md` and `ARCHITECTURE.md`.
