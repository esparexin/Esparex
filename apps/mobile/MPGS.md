# Mobile Platform Governance Standards (MPGS.md)

This document establishes the official operational standards, environment rules, and governance policies for the Esparex Mobile Platform.

---

## 1. Supported Toolchain & Version Pinning

To maintain local build consistency and eliminate compilation failures, all developer environments must align to the following pinned versions:

| Component | Pinned Version / Range | Notes |
| :--- | :--- | :--- |
| **Expo SDK** | `52.0.x` | Project baseline |
| **React Native** | `0.76.9` | Monorepo Fabric setup |
| **Node.js** | `v22.x.x` (LTS) | Enforced via `.nvmrc` |
| **JDK** | JDK 17 or 21 (LTS) | **Mandatory**. JDK 23+ will crash Gradle sync. |
| **Android Studio** | Koala / Ladybug or newer | Standard IDE |
| **Android SDK Target** | API level 35 (Android 15) | Configured in `app.json` |
| **Xcode** | `15.x` or `16.x` | Required for iOS simulator builds |
| **CocoaPods** | Managed via Bundler | Run `bundle exec pod install` |

---

## 2. Development & Build Workflows

### 2.1 Project Bootstrap & Environment Verification

A clean repository checkout requires bootstrapping before any development or testing can occur. 

> [!IMPORTANT]
> **Bootstrap Dependency Principle**: The monorepo requires shared packages to be built before tools that resolve compiled package outputs (such as Metro, Knip, or application builds) are executed. 
> 
> Build failures resulting from missing `/dist` directories must be treated as **bootstrap dependency failures**, not application code defects.

#### The Bootstrap Process:
1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Verify environment versions**: Ensure your active JDK is version 17 or 21 (run `java -version`), and your Node.js is v22.
3.  **Verify native toolchains**: Open Android Studio and Xcode to verify SDK platforms are updated.
4.  **Run Expo Doctor**: Verify peer dependencies are healthy:
    ```bash
    npx expo-doctor
    ```

### 2.2 Build Dependency Order

When compiling the project or running verification pipelines, always execute commands in the following order to satisfy monorepo dependency chains:

1.  **Build Shared Packages (Required First)**:
    ```bash
    npm run build
    ```
    *(This compiles `@esparex/design-tokens` and `@esparex/contracts` to generate their `/dist` entrypoints).*

2.  **Run Quality & Lint Gates**:
    ```bash
    npm run guard:dead-code
    npm run type-check
    npm test
    ```

3.  **Compile & Run the Mobile App**:
    ```bash
    npm run mobile:build:android
    # or
    npm run mobile:build:ios
    ```

### 2.3 Local Testing: The Simulator Workflow
Standard Expo Go is suitable only for early sandboxed prototyping. Because Esparex uses native components (Razorpay, push notification handlers), you **must** build and run custom **Expo Development Builds** (Dev Clients) for development:

*   **iOS Simulator Build**:
    ```bash
    npm run ios -w @esparex/apps-mobile
    ```
*   **Android Emulator Build**:
    ```bash
    npm run android -w @esparex/apps-mobile
    ```
*   **Running Metro Server**:
    ```bash
    npx expo start --dev-client
    ```

### 2.4 Physical Device Testing (iOS & Android)
*   **iOS Device**: Install the development build via Xcode using a **free Apple ID** for personal testing, or a paid Apple Developer account for TestFlight.
*   **Android Device**: Enable USB debugging and compile directly onto the device, or share compiled `.apk` developer client archives.

---

## 3. Dependency Governance & Approvals

### 3.1 Mobile Architecture Review
Before introducing any new dependency that contains native iOS/Android code (folders named `/ios`, `/android`, or native dependencies in `package.json`), a **mobile architecture review is required**. 

### 3.2 Evaluation Checklist
Evaluate the dependency against the following criteria:
- [ ] **Expo SDK Compatibility**: Does the library support Expo SDK 52?
- [ ] **React Native Compatibility**: Is it compatible with React Native `0.76.9`?
- [ ] **Platform Parity**: Does it support both iOS and Android?
- [ ] **New Architecture Support**: Does the native module officially support JSI/Fabric without fallback bridges?
- [ ] **Maintenance Status**: Has the repository been committed to in the last 6 months?
- [ ] **Release Cadence**: Are updates released regularly to fix upstream React Native regression bugs?
- [ ] **Community Adoption**: What is the NPM weekly download count and open issue count?
- [ ] **License Compatibility**: Is the license compatible with commercial distribution?

---

## 4. Platform Upgrade Governance

To prevent breaking features during active sprints, platform-level version upgrades are strictly isolated from feature development.

### 4.1 Upgrade Process
1.  **Dedicated Maintenance Ticket**: Create a standalone PR category for the upgrade (e.g. `chore/upgrade-expo-sdk-53`).
2.  **Compatibility Audit**: Audit the version compatibility matrix of all third-party native libraries (like Razorpay, Worklets).
3.  **Android Verification**: Run complete debug/release builds and verify on the Android Emulator.
4.  **iOS Verification**: Run complete debug/release builds and verify on the iOS Simulator.
5.  **Full Regression Testing**: Perform manual testing on critical user flows (OTP Auth, Checkout/Payments, Chat threads) before merging.

---

## 5. Release Validation Checklist

Before tag-marking a release candidate (RC) or submitting to the App Store / Google Play:

- [ ] **CI Pipeline Status**: Ensure monorepo type-checking, Jest unit tests, ESLint, and Knip checks are 100% green.
- [ ] **Expo Doctor Run**: Execute `npx expo-doctor` and verify zero peer issues.
- [ ] **Simulator Compilation**: Verify clean local builds for iOS Simulators (`x86_64`) and Android Emulators.
- [ ] **Physical iOS Testing**: Test checkout, push notifications, and chat on at least one physical iPhone.
- [ ] **Physical Android Testing**: Test checkout, push notifications, and chat on at least one physical Android phone.
- [ ] **Telemetry Mocks**: Confirm all analytics and exception-tracking logging points resolve to correct production endpoints.

---

## 6. Definition of Build Ready

A mobile code change or pull request is considered **Build Ready** for staging and release merges if and only if all of the following conditions are satisfied:

- [ ] **TypeScript Compilation**: Monorepo type-checking compiles with `0` errors across all workspaces.
- [ ] **ESLint & Quality Guards**: All files pass linting and static analysis checks.
- [ ] **Unit Tests**: The full mobile Jest test suite runs and passes with 100% green status.
- [ ] **Expo Doctor**: Execution of `npx expo-doctor` completes with zero peer dependency conflicts.
- [ ] **Android Debug Build**: Compilation of the Android debug development client succeeds.
- [ ] **Android Release Build**: Generating the production Android bundle (AAB/APK) succeeds cleanly.
- [ ] **iOS Debug Build**: Compilation of the iOS debug development client succeeds.
- [ ] **iOS Release Build**: Generating the production iOS archive (IPA) succeeds cleanly.
- [ ] **Android Smoke Testing**: Core user flows (Auth, Chat, Payments) function correctly in the Android Emulator/Device.
- [ ] **iOS Smoke Testing**: Core user flows (Auth, Chat, Payments) function correctly in the iOS Simulator/Device.
- [ ] **No Unresolved Warnings**: No critical dependency compatibility warnings or compilation exceptions remain.

---

## 7. Failure Classification Matrix

When developers encounter a compile-time, lint, or runtime error, they must classify it using the matrix below to identify the root cause layer:

| Error Type / Symptom | Error Category | Root Cause Layer | Primary Troubleshooting Steps |
| :--- | :--- | :--- | :--- |
| `Cannot find module` | Bootstrap / Dependency | Workspace package setup | Run `npm install` at root, check `workspaces` in `package.json`, compile shared packages. |
| Missing `/dist` directory | Bootstrap | Shared package outputs | Run `npm run build` from the monorepo root folder. |
| Metro cannot resolve package | Bootstrap / Workspace | Monorepo dependency drift | Build shared packages first, check peer dependency lists in `package.json`. |
| Gradle settings plugin error | Environment | System Java SDK | Verify active Java SDK version is JDK 17 or 21 (run `java -version`). |
| CocoaPods linkage error | Environment | Xcode / Bundler toolchain | Run `bundle install && bundle exec pod install` inside `apps/mobile/ios`. |
| Expo SDK mismatch | SDK Compatibility | Sandbox runtime restrictions | Verify Expo SDK version vs Expo Go. Switch to Expo Development Builds. |
| Native compilation compiler error | Native Dependency | Third-party CocoaPods/Gradle | Check package compatibility with React Native Fabric New Architecture. |
| TypeScript compilation error | Application | Local TypeScript source code | Check types, imports, interfaces, or generic parameters. |
| Jest unit test failure | Application | Business logic regression | Inspect component tests, mocks, or local service implementations. |
| ESLint / Knip failure | Code Quality | Code hygiene guidelines | Clean up unused variables, dead code, or duplicate exports. |
| Mobile runtime app crash | Application / Native | Code logic / Native module | Check Metro console log outputs, React Native log-box, or native crashlogs. |

---

## 8. The Golden Rules of Mobile Architecture Governance

All developers working on the Esparex mobile workspace must strictly adhere to the following seven principles:

1.  **Never Fix Symptoms Before Identifying the Root Cause**: Do not apply temporary workarounds or overrides without auditing why the error surfaced.
2.  **Do Not Upgrade SDKs to Solve Unrelated Build Failures**: Upgrading Expo or React Native versions to fix environmental compilation errors is strictly forbidden.
3.  **Standardize the Developer Environment**: Keep local JDK, Node.js, and package manager toolchains pinned to the official versions.
4.  **Build Shared Packages Before Running Dependent Tooling**: Always compile shared workspaces (`npm run build`) before running Metro, Knip, or application tests.
5.  **Validate New Native Dependencies Before Adopting Them**: Complete the compatibility checklist (Fabric support, maintenance, platform parity) before adding native folders to Git.
6.  **Separate Bootstrap Failures From Application Failures**: Distinguish workspace compilation requirements from actual application code defects.
7.  **Verify on Both Android and iOS Before Staging Releases**: Do not merge release candidates without verifying physical device smoke tests on both iOS and Android.
