# Esparex Mobile Platform Compatibility Matrix (PCM)

This document registers the active toolchain, SDK, compiler, and workstation runtime versions supported by the Esparex mobile workspace. It is maintained dynamically and updated with every SDK migration or environment baseline change.

---

## 1. Active Toolchain Version Constraints

The table below defines the official platform version constraints required for workstation sync and compile-time compatibility:

| Component / Toolchain | Supported / Pinned Version | Verification Command |
| :--- | :--- | :--- |
| **Node.js** | `v22.x.x` (LTS) | `node -v` |
| **npm** | `v10.x.x` | `npm -v` |
| **Expo SDK** | `v52.x.x` | `npx expo -v` |
| **React Native** | `0.76.9` | `npx react-native -v` |
| **JDK (Java)** | JDK `17` or `21` | `java -version` |
| **Android Gradle Plugin** | `8.7.2` | Checked in root gradle build files |
| **Gradle** | `8.10.2` | `cd android && ./gradlew -v` |
| **Xcode** | `Minimum v16.0` (for iOS 18 SDK) | `xcodebuild -version` |
| **CocoaPods** | `Minimum v1.15.0` | `pod --version` |

---

## 2. Active Native Packages Verification

| Linked Package | Installed Version | Architecture Validation | New Architecture (Fabric) Support |
| :--- | :--- | :--- | :--- |
| `react-native-reanimated` | `~3.16.1` | Autolinks successfully | Full native support |
| `react-native-screens` | `~4.4.0` | Autolinks successfully | Full native support |
| `react-native-safe-area-context` | `4.12.0` | Autolinks successfully | Full native support |
| `react-native-svg` | `15.8.0` | Autolinks successfully | Full native support |
| `react-native-razorpay` | `^3.0.0` | CocoaPods target strip | Managed via New Architecture Bridge Interop |
| `react-native-worklets` | `0.7.4` | Native autolink disabled | Aligned via Babel build-time compile only |
| `react-native-css-interop` | `0.2.6` | Autolinks successfully | Full native support |

---

## 3. History and Changelog

*   **2026-08-14**: Standardized JDK 17/21 limits and disabled native autolinking for `react-native-worklets` under React Native 0.76.9.
