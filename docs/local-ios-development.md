# Enterprise Engineering Standard — Local iOS Development (Free Apple ID)

## Governance Metadata

- **Document Status**: Approved
- **Owner**: Mobile Platform
- **Applies To**: Local iOS Development
- **Version**: 1.0
- **Last Updated**: 2026-08-02
- **Decision Type**: Architecture Decision Record (ADR)
- **Related Documents**:
  - Release 1.0 Physical Device Validation (R4)
  - Mobile Architecture Governance (`AGENTS.md`)
  - Notifications Integration Audit (`docs/reports/Notifications-Integration-Audit.md`)

---

## 1. Scope

This document applies **only** to local iOS development and physical device testing using a **Personal Team (Free Apple ID)**.

It does **not** apply to:
- EAS Build
- CI/CD pipelines
- TestFlight distribution
- App Store production releases
- Production code signing
- Release / Integration branches (`develop`, `main`)

---

## 2. When to Use

Use this procedure **only** when all of the following conditions are met:
- Developing and debugging locally on macOS.
- Signing with a Personal Team (Free Apple ID).
- Deploying directly to your own connected physical iPhone.
- Performing local feature development or physical UI validation.
- Not preparing or creating a production bundle or pull request.

---

## 3. When NOT to Use

Do **NOT** use this procedure when:
- Building remotely or locally with EAS (`eas build`).
- Signing with a paid Apple Developer Program membership ($99/year).
- Creating TestFlight beta release candidates.
- Creating App Store production release builds.
- Preparing or submitting code to integration or release branches.

---

## 4. Decision Matrix

| Environment | Apple Account Type | Required Workflow / Procedure |
|---|---|---|
| **iOS Simulator** | Free / None | Standard development workflow (`npm run ios`) |
| **Physical iPhone** | Free Apple ID (Personal Team) | **Follow this document (`docs/local-ios-development.md`)** |
| **Physical iPhone** | Paid Apple Developer Account | Standard signing workflow (`npm run ios -- --device`) |
| **TestFlight** | Paid Apple Developer Account | Standard release workflow (`eas build --profile preview`) |
| **App Store** | Paid Apple Developer Account | Standard release workflow (`eas build --profile production`) |

---

## 5. Why Push Notifications Are Enabled

Push Notifications (`aps-environment`) are an intentional, fully-implemented Release 1.0 feature supporting:
- Real-time marketplace offer and listing activity alerts.
- Buyer and seller direct chat messaging notifications.
- Order and transaction status updates.
- Real-time activity feed notifications.
- OS application icon badge count synchronization (`setBadgeCountAsync`).

The Push Notification capability is **not** experimental or accidental and **must remain part of the canonical production configuration**.

---

## 6. Repository Policy

1. **Production Single Source of Truth**: The repository (`app.json`, `ios/Esparex/Esparex.entitlements`) represents the authoritative production configuration.
2. **Zero Codebase Overhead**: Development-only signing workarounds must **never** be committed or merged into the codebase.
3. **Local Isolation**: All local signing adjustments must:
   - Remain local to your development workspace.
   - Be fully restored prior to staging (`git add`) or committing.
   - Never appear in a Pull Request.
   - Never modify release or integration branches.

---

## 7. Root Cause Analysis Summary

Apple's Provisioning Portal explicitly restricts Push Notifications (`aps-environment`) and APNs provisioning profiles to paid Apple Developer Program accounts ($99/year). Personal Teams (Free Apple IDs) are blocked by Apple's servers during Xcode code signing when an app bundle requests the `aps-environment` entitlement.

---

## 8. Temporary Local Development Procedure

If you are using a Free Apple ID for physical device testing, Apple's provisioning service cannot sign an application that requests the APNs entitlement. Follow this temporary procedure:

1. **Prepare Local Environment**: Connect physical iPhone via USB and trust computer.
2. **Apply Temporary Uncommitted Local Adjustment**:
   - For local physical iPhone code signing only, apply a temporary, uncommitted local signing adjustment to exclude the APNs entitlement during signing.
3. **Build & Debug in Xcode**:
   - Open `apps/mobile/ios/Esparex.xcworkspace` in Xcode.
   - Select your connected physical iPhone and choose your Personal Team under **Signing & Capabilities**.
   - Build and run the app.
4. **Perform Device Testing**: Validate UI, Camera, Photo Library, SecureStore, and REST API functionality on device.
5. **Restore Repository State Immediately**:
   - Restore the canonical repository configuration immediately after testing.
   - Confirm `git status` returns a clean working tree before staging or committing.

---

## 9. Local Development Safety Rules

- **Rule 1**: Never commit local signing adjustments.
- **Rule 2**: Never commit modified entitlements.
- **Rule 3**: Never modify `app.json` for Free Apple ID support.
- **Rule 4**: Never disable production capabilities permanently.
- **Rule 5**: Never submit a Pull Request containing local development workarounds.
- **Rule 6**: Restore the repository state before switching branches or staging files.
- **Rule 7**: Verify `git status` is clean before every commit.

---

## 10. Exit Criteria

Before committing any code or opening a Pull Request:
- [ ] `git diff` shows no local signing or entitlement changes.
- [ ] `git status` reports working tree is clean.
- [ ] Canonical production entitlements (`aps-environment`) are intact.
- [ ] Push Notification capability remains in `app.json` and `Esparex.entitlements`.
- [ ] Production configuration matches the repository single source of truth.

---

## 11. Architectural Decision Record (ADR) — Local Free Apple ID Development

### Context
Esparex is undergoing Release 1.0 physical device validation. Developers testing locally with a free Apple ID encounter Xcode code signing errors because Apple restricts APNs entitlements to paid accounts.

### Decision
Use a documented local development procedure rather than introducing permanent configuration branching (`app.config.js`), custom Expo plugins, or environment-specific build logic into the repository.

### Rationale
- **Preserves Production Integrity**: Keeps `app.json` and production entitlements clean and single-sourced.
- **Eliminates Code Overhead**: Avoids introducing build-time abstraction layers that every developer would need to maintain.
- **Separates Concerns**: Isolates Apple's platform account restriction from application software architecture.
- **Zero Risk**: Completely avoids accidental production capability degradation.

---

## 12. Git Hygiene & Verification Commands

To verify that your workspace is clean and ready for committing:

```bash
# 1. Restore local entitlements if modified during testing
git checkout -- apps/mobile/ios/Esparex/Esparex.entitlements

# 2. Check for unexpected diffs
git diff

# 3. Verify clean working tree
git status
```

**Expected Output**:
```text
nothing to commit, working tree clean
```

---

## 13. Future State

When Esparex is enrolled in the Apple Developer Program or added to an existing paid Apple Developer Team:
- Discontinue the temporary local adjustment procedure.
- Use standard Xcode / EAS automatic signing workflows.
- Retain this document for onboarding and reference.
