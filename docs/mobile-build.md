# Esparex Mobile — Build Readiness Guide

## Governance Metadata

- **Document Status**: Approved
- **Owner**: Mobile Platform
- **Applies To**: Android APK, iOS IPA, EAS Build, Production AAB, TestFlight
- **Version**: 1.0
- **Last Updated**: 2026-08-13
- **Decision Type**: Operational Reference
- **Related Documents**:
  - [`docs/local-ios-development.md`](./local-ios-development.md)
  - [`docs/governance/DEVOPS-GOVERNANCE.md`](./governance/DEVOPS-GOVERNANCE.md)
  - [`apps/mobile/eas.json`](../apps/mobile/eas.json)
  - [`apps/mobile/app.json`](../apps/mobile/app.json)

> **Audit basis:** Every claim in this document was verified against the actual
> repository files. This document reflects the state of the repository at the
> time of writing, not assumed defaults or EAS documentation examples.

---

## 1. Platform Configuration (Verified)

| Property | Value | Source |
|---|---|---|
| Expo SDK | `~52.0.0` | `apps/mobile/package.json` |
| React Native | `0.76.9` | `apps/mobile/package.json` |
| New Architecture | `true` | `app.json` + `gradle.properties` |
| JS Engine | Hermes | `Podfile.properties.json` |
| Android Package | `com.esparex.mobile` | `app.json` + `build.gradle` |
| iOS Bundle ID | `com.esparex.mobile` | `app.json` + Xcode project |
| iOS Deployment Target | `15.1` | `app.json` + `Podfile.properties.json` |
| Android Compile/Target SDK | `35` | `gradle.properties` |
| Android Build Tools | `35.0.0` | `gradle.properties` |
| EAS CLI Minimum Version | `>= 12.5.0` | `eas.json` |
| Version Source | `remote` | `eas.json` — versions tracked in EAS, not `app.json` |

---

## 2. EAS Build Profiles (Verified from `eas.json`)

Three profiles are configured:

### `development`
- Dev client enabled (`developmentClient: true`)
- iOS: **simulator only** — not for real-device testing
- Android: no build defined
- Distribution: internal
- Channel: `development`
- `EX_DEV_CLIENT_NETWORK_INSPECTOR: true`

### `preview` ← **Use this for QA real-device testing**
- Distribution: internal
- Android: `buildType: apk` — produces a directly installable `.apk`
- iOS: inherits `distribution: internal`, uses ad-hoc provisioning
- Channel: `preview`
- API URL: `https://api.esparex.in/api`
- **No explicit iOS block** — device registration required before build (see §5)

### `production`
- Android: `buildType: app-bundle` — produces `.aab` for Play Store
- iOS: App Store distribution
- Channel: `production`
- `autoIncrement: true` — EAS manages `versionCode`/`buildNumber` remotely
- API URL: `https://api.esparex.in/api`
- **Submission config is present but empty** (`"submit": { "production": {} }`) — store credentials must be configured before `eas submit`

---

## 3. Confirmed Gaps (Audit Findings)

These gaps were identified by direct inspection of the repository. They are
not assumptions — each has a file reference.

### 3.1 Android Release Build Uses Debug Keystore

**File:** `apps/mobile/android/app/build.gradle`

```groovy
release {
    // Caution! In production, you need to generate your own keystore file.
    signingConfig signingConfigs.debug   // ← debug keystore
}
```

**Impact:**
- EAS Cloud builds override this with EAS-managed credentials during `eas build`.
  The preview and production APK/AAB from EAS Cloud are correctly signed.
- Local Gradle builds (`./gradlew assembleRelease`) produce a debug-signed
  artifact that is **not acceptable for Play Store submission**.

**Resolution:** Before any local release build is used for distribution, wire a
proper `release` signing config using environment variables or a secrets manager.
Do not commit keystore passwords to version control.

---

### 3.2 `google-services.json` Is Missing

**Expected path:** `apps/mobile/android/app/google-services.json`

**Impact:**
- The file is correctly excluded from version control (root `.gitignore` lines 67–68).
- Without it, Firebase Cloud Messaging (FCM) for Android push notifications
  **will not function** on any build — EAS Cloud, local debug, or release.
- A safe placeholder example is provided at
  `apps/mobile/google-services.json.example` (this file IS tracked).

**Resolution:**
1. Log in to the Firebase Console for project `com.esparex.mobile`.
2. Download `google-services.json` from Project Settings → Your Apps → Android.
3. Place it at `apps/mobile/android/app/google-services.json`.
4. Do not commit this file — it is gitignored.
5. For CI/CD, provide the file contents as an EAS Secret or CI environment variable.

---

### 3.3 iOS APNs Entitlement Is Set to `development`

**File:** `apps/mobile/ios/Esparex/Esparex.entitlements`

```xml
<key>aps-environment</key>
<string>development</string>
```

**Impact:**
- Acceptable for `preview` (ad-hoc) builds and simulator testing.
- Push notifications **will not be delivered** on TestFlight or App Store
  distribution until this is changed to `production`.

**Resolution:** This change is tracked in a **separate dedicated PR**
(`chore/issue-NNN-ios-production-apns`) to ensure it receives independent
review as a production configuration change. Do not combine with documentation
hygiene changes.

---

### 3.4 EAS Credentials Have Not Been Verified

**Impact:** `eas build` will fail or prompt interactively if credentials are
not configured for either platform.

**Resolution (run once per project):**

```bash
# Android — generates or uploads the release keystore
eas credentials --platform android

# iOS — sets up distribution certificate + provisioning profile
eas credentials --platform ios

# iOS push — upload APNs .p8 key from Apple Developer portal
# Apple Developer → Certificates, Identifiers & Profiles → Keys
eas credentials --platform ios
```

---

### 3.5 iOS Test Devices Not Registered (for `preview` profile)

**Impact:** The `preview` profile uses ad-hoc distribution. An IPA built
without the target device's UDID registered in Apple Developer **cannot be
installed** on that device.

**Resolution (run before `eas build --profile preview --platform ios`):**

```bash
cd apps/mobile
eas device:create
# Opens a registration URL — visit this on each target iPhone/iPad
# Then re-run eas build to include the new devices in the provisioning profile
```

---

### 3.6 No Automated EAS Build in CI

**File:** `.github/workflows/ci.yml`

The CI pipeline runs `npx expo export` (bundle verification only). It does
not trigger `eas build`. All preview and production builds must be **triggered
manually**.

**Impact:** Builds are not automatically produced on PR merge. This is
acceptable for the current stage and does not block QA.

---

## 4. Pre-Build Checklist

Complete this checklist before triggering the first build for each platform.

### Android

- [ ] `eas login` — confirm the logged-in account owns the `esparex` Expo slug
- [ ] `eas credentials --platform android` — confirm release keystore exists in EAS
- [ ] `apps/mobile/android/app/google-services.json` placed (not committed)
- [ ] `cd apps/mobile && eas build --platform android --profile preview`

### iOS

- [ ] `eas login` — same account as Android
- [ ] `eas credentials --platform ios` — distribution cert + App Store profile
- [ ] APNs `.p8` key uploaded via `eas credentials --platform ios`
- [ ] Test device UDIDs registered via `eas device:create`
- [ ] `cd apps/mobile && eas build --platform ios --profile preview`

---

## 5. Validated Build Workflow

```
develop branch
    │
    CI passes (expo export bundle check + all monorepo tests)
    │
    ── Manual trigger (EAS Cloud) ─────────────────────────────────────
    │
    ├── Android preview APK
    │     cd apps/mobile
    │     eas build --platform android --profile preview
    │     ↳ EAS Cloud injects managed signing credentials
    │     ↳ .apk available from expo.dev dashboard or eas build:download
    │     ↳ Install: adb install <file>.apk  OR  QR code / download link
    │     ↳ Android functional QA can begin immediately
    │     ↳ Push notification QA requires google-services.json (see §3.2)
    │
    ├── iOS preview IPA
    │     eas device:create  ← register target devices FIRST
    │     eas build --platform ios --profile preview
    │     ↳ Ad-hoc IPA via EAS internal distribution link
    │     ↳ iOS functional QA can begin on registered devices
    │     ↳ Push testing requires APNs credentials (see §3.4)
    │
    QA finds issues → fix on develop → rebuild preview
    │
    Production build (after QA sign-off + credential verification)
    │
    ├── Android AAB
    │     eas build --platform android --profile production
    │     ↳ Signed .aab → upload to Play Console internal testing track
    │     eas submit --platform android --profile production
    │
    └── iOS IPA (TestFlight)
          [Requires aps-environment=production — separate PR]
          eas build --platform ios --profile production
          eas submit --platform ios --profile production
          ↳ Internal TestFlight testers: available within minutes of processing
          ↳ External TestFlight testers: after Apple review (duration varies)
```

---

## 6. Feature Availability by Build Stage

| Feature | Preview APK (Android) | Preview IPA (iOS) | Production |
|---|---|---|---|
| Core app functionality | ✅ | ✅ | ✅ |
| Chat (incl. delivery status) | ✅ | ✅ | ✅ |
| Listings / search | ✅ | ✅ | ✅ |
| Payments (Razorpay) | ✅ | ✅ | ✅ |
| Push notifications | 🔴 Blocked (FCM config) | ⚠️ Verify APNs | ✅ After credential setup |
| Real-device testing | ✅ | ✅ Registered devices only | ✅ |
| Play Store / App Store | ❌ | ❌ | ✅ |

---

## 7. Quick Reference Commands

```bash
# From apps/mobile/

# QA — Android APK (real device, no Play Store)
eas build --platform android --profile preview

# QA — iOS IPA (registered devices, no TestFlight)
eas build --platform ios --profile preview

# Production — both platforms
eas build --platform all --profile production

# Check build status
eas build:list

# Download latest Android build
eas build:download --platform android

# Submit to stores (after production build)
eas submit --platform android --profile production
eas submit --platform ios --profile production

# Credential management
eas credentials --platform android
eas credentials --platform ios

# Register test devices (iOS ad-hoc only)
eas device:create
```

---

## 8. Follow-up Required

| Item | PR / Action |
|---|---|
| Change `aps-environment` → `production` in `Esparex.entitlements` | `chore/issue-NNN-ios-production-apns` (separate PR) |
| Wire release signing config in `build.gradle` for local release builds | Future chore PR |
| Add `google-services.json` from Firebase Console | External action — not committed |
| Configure EAS credentials for Android + iOS | External action — `eas credentials` |
| Register test iPhones | External action — `eas device:create` |
| Automate `eas build` in CI on release tag | Future CI PR |
