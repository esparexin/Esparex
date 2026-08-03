# Esparex Platform Capability & Integration Catalog

This catalog serves as the Single Source of Truth (SSOT) inventory for all platform capabilities (hardware/OS features) and platform integrations (cloud services/SDKs) across the Esparex multi-platform monorepo.

---

## 1. Platform Capability Catalog (Hardware & OS Features)

Every platform capability MUST have exactly **one shared contract interface** in `@esparex/contracts` or `@esparex/shared`, **one Web Adapter** (`apps/web`), **one iOS Adapter** (`apps/mobile`), and **one Android Adapter** (`apps/mobile`).

### 1.1 Media & File Picker (`IPlatformMediaCapability`)
- **Owner:** `PlatformMediaCapabilityService`
- **Contract Interface:** `IPlatformMediaCapability` (`@esparex/contracts`)
- **Web Adapter:** `WebMediaPickerAdapter` (`apps/web`) ──► Native OS File Picker (`<input type="file">`)
- **iOS Adapter:** `IOSMediaPickerAdapter` (`apps/mobile`) ──► Native iOS Photo Library & Camera
- **Android Adapter:** `AndroidMediaPickerAdapter` (`apps/mobile`) ──► Native Android Media Store & Camera
- **Consumers:** Listing Creation Wizard, Chat Attachment, User Avatar Upload, Business KYC Verification
- **Status:** STABLE (v1.0)
- **Test Suite:** `@esparex/core/__tests__/capabilities/PlatformMediaCapability.spec.ts`

### 1.2 Camera Capture (`IPlatformCameraCapability`)
- **Owner:** `PlatformCameraCapabilityService`
- **Contract Interface:** `IPlatformCameraCapability` (`@esparex/contracts`)
- **Web Adapter:** `WebCameraAdapter` (`apps/web`) ──► WebRTC `getUserMedia` / Native Input Capture
- **iOS Adapter:** `IOSCameraAdapter` (`apps/mobile`) ──► `expo-camera` / AVFoundation
- **Android Adapter:** `AndroidCameraAdapter` (`apps/mobile`) ──► `expo-camera` / CameraX
- **Consumers:** Fast Photo Capture, Document Scanning, QR Verification
- **Status:** STABLE (v1.0)

### 1.3 Clipboard (`IPlatformClipboardCapability`)
- **Owner:** `PlatformClipboardCapabilityService`
- **Contract Interface:** `IPlatformClipboardCapability` (`@esparex/shared`)
- **Web Adapter:** `WebClipboardAdapter` (`apps/web`) ──► Navigator Clipboard API (`navigator.clipboard`)
- **iOS Adapter:** `IOSClipboardAdapter` (`apps/mobile`) ──► `expo-clipboard` / UIPasteboard
- **Android Adapter:** `AndroidClipboardAdapter` (`apps/mobile`) ──► `expo-clipboard` / ClipboardManager
- **Consumers:** Listing Link Copy, Referral Code Copy, Chat Message Copy
- **Status:** STABLE (v1.0)

### 1.4 GPS & Geolocation (`IPlatformLocationCapability`)
- **Owner:** `PlatformLocationCapabilityService`
- **Contract Interface:** `IPlatformLocationCapability` (`@esparex/contracts`)
- **Web Adapter:** `WebLocationAdapter` (`apps/web`) ──► Geolocation API (`navigator.geolocation`)
- **iOS Adapter:** `IOSLocationAdapter` (`apps/mobile`) ──► CoreLocation / `expo-location`
- **Android Adapter:** `AndroidLocationAdapter` (`apps/mobile`) ──► FusedLocationProvider / `expo-location`
- **Consumers:** Distance Search, Nearby Listings, Address Auto-Detect
- **Status:** STABLE (v1.0)

### 1.5 Biometrics & Passkeys (`IPlatformBiometricsCapability`)
- **Owner:** `PlatformBiometricsCapabilityService`
- **Contract Interface:** `IPlatformBiometricsCapability` (`@esparex/contracts`)
- **Web Adapter:** `WebBiometricsAdapter` (`apps/web`) ──► WebAuthn API / Passkeys
- **iOS Adapter:** `IOSBiometricsAdapter` (`apps/mobile`) ──► LocalAuthentication (Face ID / Touch ID)
- **Android Adapter:** `AndroidBiometricsAdapter` (`apps/mobile`) ──► BiometricPrompt API
- **Consumers:** Quick Re-Auth, High-Value Transaction Approval, Wallet Withdrawal
- **Status:** STABLE (v1.0)

---

## 2. Platform Integration Catalog (External Services & SDKs)

### 2.1 Push & Local Notifications (`IPushNotificationIntegration`)
- **Owner:** `PushNotificationIntegrationService`
- **Contract Interface:** `IPushNotificationIntegration` (`@esparex/contracts`)
- **Web Adapter:** `WebPushNotificationAdapter` (`apps/web`) ──► Web Push API + Service Worker
- **iOS Adapter:** `IOSPushNotificationAdapter` (`apps/mobile`) ──► APNs + Firebase Cloud Messaging
- **Android Adapter:** `AndroidPushNotificationAdapter` (`apps/mobile`) ──► FCM + Expo Notifications
- **Consumers:** Chat Messages, Price Alerts, Moderation Status Updates, System Announcements
- **Status:** STABLE (v1.0)

### 2.2 Payment Gateways & In-App Purchases (`IPaymentIntegration`)
- **Owner:** `PaymentIntegrationService`
- **Contract Interface:** `IPaymentIntegration` (`@esparex/contracts`)
- **Web Adapter:** `WebPaymentAdapter` (`apps/web`) ──► Razorpay / Stripe Web Checkout
- **iOS Adapter:** `IOSPaymentAdapter` (`apps/mobile`) ──► Apple In-App Purchase / Native SDK
- **Android Adapter:** `AndroidPaymentAdapter` (`apps/mobile`) ──► Google Play Billing / Native SDK
- **Consumers:** Ad Promotion Checkouts, Featured Listing Bundles, Business Subscriptions
- **Status:** STABLE (v1.0)

### 2.3 Maps & Geospatial SDKs (`IMapIntegration`)
- **Owner:** `MapIntegrationService`
- **Contract Interface:** `IMapIntegration` (`@esparex/contracts`)
- **Web Adapter:** `WebMapAdapter` (`apps/web`) ──► `@react-google-maps/api`
- **iOS Adapter:** `IOSMapAdapter` (`apps/mobile`) ──► Apple Maps / Google Maps SDK
- **Android Adapter:** `AndroidMapAdapter` (`apps/mobile`) ──► Google Maps SDK
- **Consumers:** Search Radius Picker, Listing Location Map View, Route Navigation
- **Status:** STABLE (v1.0)

---

## 3. Capability Maturity Lifecycle

| Maturity Level | Criteria | Registered Capabilities |
| :--- | :--- | :--- |
| **STABLE (v1.0)** | 100% Contract Coverage, 3 Adapters (Web, iOS, Android), E2E Parity Tests Passed | Media, Camera, Clipboard, Location, Biometrics, Notifications, Payments, Maps |
| **EXPERIMENTAL (v0.x)** | Prototype Contract, Active Development, Partial Adapter Coverage | AI Camera Capture, Local Vision OCR, Voice Search, Spatial AR |

---

## 4. Governance Rule

No feature module may instantiate hardware SDKs or browser APIs directly. All interactions MUST consume the canonical owner listed in this catalog.
