# Esparex Platform Architecture Operating Model (v4.0 Enterprise Standard)

## Core Architectural Axiom

> **Business rules must never depend on platform. Platform only changes how users interact with the system—not what the system does.**

This document defines the authoritative architecture operating model for multi-platform development across the Esparex monorepo (`apps/web`, `apps/mobile`, `apps/admin`, `@esparex/ui`, `@esparex/core`, `@esparex/contracts`).

---

## 1. Day-to-Day Development Decision Tree

Before writing any code, engineers and AI agents MUST process every feature through the architectural decision tree:

```text
Is this business logic, domain calculation, or validation?
    │
    ├── YES ──► Write in @esparex/core or @esparex/contracts
    │
    └── NO
         │
         ├── Is it a reusable presentation control, token, or layout primitive?
         │    │
         │    ├── YES ──► Write inside @esparex/ui
         │    │
         │    └── NO
         │         │
         │         ├── Is it a device hardware or browser OS capability?
         │         │    │
         │         │    ├── YES ──► Extend/Implement Platform Capability Catalog (Contract + Adapters)
         │         │    │
         │         │    └── NO
         │         │         │
         │         │         ├── Is it an external cloud service, payment gateway, or SDK integration?
         │         │         │    │
         │         │         │    ├── YES ──► Extend/Implement Platform Integration Catalog (Contract + Adapters)
         │         │         │    │
         │         │         │    └── NO ──► Feature Module Orchestration Layer
```

---

## 2. Platform Expansion & Evolution Policy

When expanding support to new target platforms (e.g. macOS desktop native, Windows desktop native, Vision Pro, Android TV, Wearables):

> **A new platform must not introduce new business logic. It may only introduce new capability adapters, integration bindings, UI compositions, and platform-specific interaction patterns.**

Supporting a new target platform requires **zero changes** to `@esparex/core` or `@esparex/contracts`.

---

## 3. Capability Extension Before Creation Gate

Before proposing or creating a new platform capability or contract, answer the Architecture Extension Gate:

> **"Can this feature be implemented by extending an existing capability contract instead of creating a new one?"**

- *Example:* Do NOT create `IPdfCapability`. Extend `IPlatformMediaCapability` to support PDF document MIME types and file picking.
- *Example:* Do NOT create `IFaceIdCapability`. Extend `IPlatformBiometricsCapability` to support Face ID, Touch ID, and WebAuthn passkeys.

---

## 4. Feature Classification Framework (Pre-Implementation Requirement)

Every feature MUST be classified into one of five architectural tiers before code is generated or written:

1. **Shared Business Logic:** Domain invariants, validation schemas, state machines, and calculations (`@esparex/core`, `@esparex/contracts`).
2. **Shared UI / Design System:** Universal layout containers, typography, tokens, and presentation components (`@esparex/ui`).
3. **Platform Capability:** Device hardware and browser OS capabilities accessed strictly through contract abstractions (`IPlatformCapability`).
4. **Platform Integration:** Cloud services, push notifications, payment gateways, and third-party SDK bindings.
5. **Platform UX:** Native interaction patterns, gestures, navigation flows, and dialog behavior tailored to the target platform.

---

## 5. Platform Architecture Decision Record (PADR)

Every non-trivial feature or platform interaction MUST document a Platform Architecture Decision Record (PADR) before implementation:

| Dimension | Specification |
| :--- | :--- |
| **Business Workflow** | *e.g., Upload Listing Images / Initiate Chat Call / Authenticate User* |
| **Shared Business Logic** | Yes (100% shared in `@esparex/core`) |
| **Platform Capability / Integration** | `IPlatformMediaCapability` / `IPlatformBiometricsCapability` |
| **Shared Contract Interface** | Defined in `@esparex/contracts` / `@esparex/shared` |
| **Web Adapter (`apps/web`)** | Native OS File Browser Dialog (`<input type="file">`) |
| **Android Adapter (`apps/mobile`)** | Native Android Media Store & Camera Picker |
| **iOS Adapter (`apps/mobile`)** | Native iOS Photos & Camera Picker |
| **Design System Impact** | Zero platform-specific dialog leaks in `@esparex/ui` |

---

## 6. Categorized Platform Catalogs

Capabilities and integrations MUST NOT be mixed. Every item belongs to exactly one canonical catalog:

### A. Platform Capability Catalog (Hardware & OS Features)
- **Stable Capabilities:**
  - Camera (`IPlatformCameraCapability`)
  - Media & File Picker (`IPlatformMediaCapability`)
  - File System (`IPlatformFileCapability`)
  - Clipboard (`IPlatformClipboardCapability`)
  - GPS & Geolocation (`IPlatformLocationCapability`)
  - Device Contacts (`IPlatformContactsCapability`)
  - Biometrics & Passkeys (`IPlatformBiometricsCapability`)
  - Storage & Cache (`IPlatformStorageCapability`)
  - Haptics & Vibration (`IPlatformHapticsCapability`)
- **Experimental Capabilities (Maturity Gated):**
  - AI Camera Capture (`IPlatformAiCameraCapability`)
  - Local Vision OCR (`IPlatformOcrCapability`)
  - Voice & Audio Processing (`IPlatformVoiceCapability`)
  - AR / Spatial Scanning (`IPlatformSpatialCapability`)

### B. Platform Integration Catalog (External Services & SDKs)
- **Stable Integrations:**
  - Push & Local Notifications (`IPushNotificationIntegration`)
  - Payment Gateways & In-App Purchases (`IPaymentIntegration`)
  - Auth Providers & OAuth (`IAuthIntegration`)
  - Maps & Geospatial SDKs (`IMapIntegration`)
  - Analytics & Telemetry (`ITelemetryIntegration`)
  - Deep Links & Universal Links (`IDeepLinkIntegration`)
  - Share Sheet & Intent Dispatch (`IShareIntegration`)
  - Background Tasks & Job Schedulers (`IBackgroundTaskIntegration`)

**Rule:** Every registered item in a catalog MUST have:
- Exactly **one shared contract interface** in `@esparex/contracts` or `@esparex/shared`.
- Exactly **one Web Adapter** (`apps/web`).
- Exactly **one iOS Adapter** (`apps/mobile`).
- Exactly **one Android Adapter** (`apps/mobile`).

---

## 7. Single Ownership & Capability Inversion

Capabilities and integrations MUST have exactly **one canonical owner service**.

Feature components (`ListingWizard`, `ChatThread`, `UserProfile`, `BusinessSettings`) are **forbidden** from implementing ad-hoc uploads, camera triggers, or biometric calls independently. They MUST consume the central capability provider.

```text
               Central Capability Owner
              (PlatformMediaCapability)
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
    WebAdapter       iOSAdapter      AndroidAdapter
         │                │                │
         └────────────────┼────────────────┘
                          ▼
            Feature Consumers (Listing, Chat, User)
```

---

## 8. Measurable Architecture Debt Definitions

Automated and manual reviews MUST flag the following as **Architecture Debt**:

- 🚨 **Duplicate Platform Adapters:** Multiple implementations of the same capability across feature folders.
- 🚨 **Duplicate Capability Contracts:** Parallel contract interfaces solving the same platform need.
- 🚨 **Scattershot Platform Branching:** Inlining platform checks (`useIsMobile`, `Platform.OS === 'web'`) inside UI components.
- 🚨 **Hardware API Leakage:** Invoking `navigator.mediaDevices`, `window.location`, or `expo-image-picker` inside React components.
- 🚨 **Domain Core Leaks:** Importing platform-specific APIs or browser concepts inside `@esparex/core`.
- 🚨 **Device-Specific Business Validation:** Applying different validation or pricing logic based on host OS.

---

## 9. Platform Anti-Patterns (Strictly Forbidden)

- ❌ **Mobile Dialog Leaks on Desktop:** Rendering mobile action sheets (e.g., "Choose from Gallery" or "Take Photo" modals) on desktop browsers.
- ❌ **Hover-Only Dependencies on Touch:** Relying on mouse hover events for critical UX actions without touch-friendly fallbacks.
- ❌ **Direct Hardware API Calls in UI:** Invoking `navigator.mediaDevices`, `window.location`, or `expo-image-picker` inside React UI components.
- ❌ **Scattershot Platform Branching:** Inlining platform checks (`useIsMobile`, `Platform.OS === 'web'`) across feature components.
- ❌ **Duplicate Capability Implementations:** Creating multiple feature-specific upload or camera handlers.
- ❌ **Device-Specific Business Validation:** Applying different business validation rules or price calculation formulas based on the target OS.

---

## 10. Capability Lifecycle Protocol

Every new platform capability or integration MUST follow this sequential 8-step lifecycle:

```text
Step 1: Need Identified ──► Step 2: Feature Classification & PADR ──► Step 3: Shared Contract Definition 
                                                                               │
Step 6: iOS Adapter Implementation ◄── Step 5: Android Adapter Implementation ◄── Step 4: Web Adapter Implementation
          │
          ▼
Step 7: Multi-Platform Quality Gate Verification ──► Step 8: Documented Capability Release
```

---

## 11. AI & Monorepo Code Generation Rule

Before generating platform-specific code, AI agents and human developers **MUST** classify the feature according to the Platform Governance Framework, document a PADR, and reuse existing capability contracts instead of introducing new platform-specific implementations.

---

## 12. Multi-Platform Verification Quality Gate

No pull request containing platform capabilities or integrations may be merged unless all items pass verification:

- [ ] **Web Desktop Verified:** Verified on Desktop Chrome/Safari. Hardware/media capabilities use browser-native patterns (e.g., native OS File Picker). Zero mobile hardware dialogs rendered.
- [ ] **Web Mobile Verified:** Verified responsive behavior and web capability fallbacks on mobile browsers.
- [ ] **Tablet Web Verified:** Verified touch & pointer interaction parity on tablet viewports.
- [ ] **iOS Native Verified:** Verified native iOS device/simulator behavior with native permission handling.
- [ ] **Android Native Verified:** Verified native Android device/emulator behavior with native back button and permission handling.
- [ ] **Parity Verification:** Business logic, validation rules, and API DTO contracts are 100% identical across all 5 platforms.
