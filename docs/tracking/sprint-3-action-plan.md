# Engineering Action Plan — Post Sprint 2

**Generated from**: Sprint 2 artifacts only. No work invented.  
**Evidence sources**:
- `docs/tracking/sprint-2-closing-report.md` — Verification Matrix, Outstanding Work, Final Metrics
- `docs/architecture/decision-register.md` — D-004 (Pending ADR)
- `docs/tracking/engineering-action-register.md` — EA-017 (symlink workaround)
- `docs/tracking/token-exceptions.md` — 9 ADR-blocked suppressions, 13 resolvable
- `docs/tracking/inline-style-audit.md` — 13 migrate, 1 permanent, 1 deferred
- `docs/tracking/sprint-2.md` — Visual QA pending PR 3 & PR 4

---

## 1. Immediate Actions (Blocking Sprint 3)

These items must be resolved before Sprint 3 implementation begins. Without them, subsequent PRs cannot close their acceptance criteria.

---

### IA-001 — Resolve ADR-D004: Action Color Decision

**Priority**: 🔴 Critical  
**Owner**: Architecture + Design Team  
**Estimated PR**: ADR document only (no code until decision)  
**Status**: Blocked — awaiting design team input

**Evidence**  
- Decision Register: D-004 status = Pending  
- token-exceptions.md: "ADR required before Sprint 3 begins"  
- engineering-action-register.md: EA-013 — `base.action` = `#2563eb` added as primitive only

**Blocking Dependency**  
Design team must select one of three options:

| Option | Action | Risk |
|--------|--------|------|
| A | Add `semantic.light.action` → `#2563eb` | Low — additive, non-breaking |
| B | Update brand palette to blue-600 | High — full visual regression |
| C | Accept `#0284c7` as canonical action color | Medium — design sign-off + component updates |

**Files Affected**
```
packages/design-tokens/src/colors.ts         — promote base.action to semantic layer
docs/architecture/decision-register.md       — update D-004 status
docs/tracking/token-exceptions.md            — resolve 9 ADR-blocked suppressions
```

**Acceptance Criteria**
- [ ] ADR-D004 document written and approved
- [ ] `semantic.light.action` (or equivalent) added to `colors.ts`
- [ ] `docs/design-system/token-catalog.md` updated with new token
- [ ] D-004 status updated to Approved
- [ ] Engineering Action Register: new EA entry created

---

### IA-002 — Resolve node_modules Symlink (EA-017)

**Priority**: 🟡 High  
**Owner**: Platform Engineer  
**Estimated PR**: Sprint 3 PR 0 (infrastructure, no app code)  
**Status**: Active workaround (EA-017)

**Evidence**  
- engineering-action-register.md: EA-017 — "Risk: Symlink is not committed to version control. Any `npm install` or `node_modules` deletion will remove it."
- sprint-2-closing-report.md: "node_modules symlink workaround (Node engine version constraint)"

**Current Impact**  
Any clean install (CI, new developer, `rm -rf node_modules`) silently breaks `@esparex/design-tokens` resolution in `apps/mobile`. TypeScript and lint would fail on a fresh clone.

**Files Affected**
```
packages/design-tokens/package.json   — audit/relax engines field
apps/mobile/package.json              — verify workspace resolution
.nvmrc (root)                         — pin Node version if missing
```

**Acceptance Criteria**
- [ ] `npm install` succeeds without manual symlink in clean environment
- [ ] `npx tsc --noEmit` (apps/mobile) passes after clean install
- [ ] EA-017 status updated to Resolved

---

## 2. Technical Debt

Debt intentionally deferred from Sprint 2. Evidence-based only.

---

### TD-001 — 9 eslint-disable Suppressions (Action Color)

**Evidence**: token-exceptions.md — "9 suppressions remain pending ADR resolution"

**Current Impact**: 9 production files contain `eslint-disable-next-line react-native/no-color-literals` with `#2563eb`. If the color changes in the design system, these files will not update automatically.

**Risk**: Medium — suppressions mask future drift; no compile-time protection

**Files**
```
BusinessStatusScreen.tsx         — editButton
StepDocumentsUpload.tsx          — uploadButton
PlanSelectionScreen.tsx          — planPrice, buyButton
TransactionHistoryScreen.tsx     — amount
SmartAlertsScreen.tsx            — addButton, createButton
CreateSmartAlertModal.tsx        — submitButton
BusinessRegistrationWizardScreen.tsx — nextButton
SavedAdsScreen.tsx               — exploreButton
```

**When to fix**: After IA-001 (ADR-D004) is resolved  
**Estimated effort**: 1 PR, 9 files, 1–2 hours  
**Blocking dependency**: IA-001 (ADR-D004)

---

### TD-002 — 13 Resolvable Token Suppressions

**Evidence**: token-exceptions.md — "Resolvable in Sprint 3 (13 exceptions)" table

**Current Impact**: 13 `eslint-disable-next-line` suppressions can now be replaced with semantic tokens added in PR 7. They are no longer genuinely missing — the tokens exist.

**Risk**: Low — suppressions are documented; no visual regression risk

**Files** (from token-exceptions.md)
```
BusinessStatusScreen.tsx      — pendingCard, activeCard, rejectedCard
StepDocumentsUpload.tsx       — loadingBanner, loadingText, uploadedButton
PlanSelectionScreen.tsx       — walletCard, walletTitle, walletLabel
TransactionHistoryScreen.tsx  — statusSuccess, statusPending
SmartAlertsScreen.tsx         — deleteText
CreateSmartAlertModal.tsx     — overlay
```

**Replacement tokens available** (all added in PR 7 / EA-012)
```
semantic.light['warning-dark']     → #d97706
semantic.light['success-dark']     → #16a34a
semantic.light['destructive-dark'] → #dc2626
semantic.light['info-subtle']      → #eff6ff
semantic.light['info-dark']        → #1d4ed8
semantic.light['success-subtle']   → #dcfce7
semantic.light['inverse-surface']  → #1e293b
semantic.light['inverse-muted']    → #94a3b8
semantic.light['inverse-subtle']   → #cbd5e1
semantic.light.overlay             → rgba(15, 23, 42, 0.6)
```

**When to fix**: Sprint 3 — independent of IA-001  
**Estimated effort**: 1 PR, 7 files, 2–3 hours  
**Blocking dependency**: None

---

### TD-003 — 13 Inline Style Migrations (Chat, Listings, PostAd)

**Evidence**: inline-style-audit.md — "13 static violations → deferred to Sprint 3"

**Current Impact**: 13 static inline style objects remain across 10 files. They are re-created on every render rather than being hoisted to compile-time constants.

**Risk**: Low — no visual regression; minor performance overhead

**Files** (from inline-style-audit.md)
```
Chat:
  ChatThreadScreen.tsx:125         — contentContainerStyle { padding: 16, paddingBottom: 20 }
  ConversationListScreen.tsx:43    — Image { width: 48, height: 48, borderRadius: 8 }

Listings:
  FilterBar.tsx:31                 — contentContainerStyle { alignItems: 'center', gap: 8 }
  FilterModal.tsx:183, 186         — AppButton { flex: 1 }, { flex: 2 }
  MarketplaceScreen.tsx:110        — contentContainerStyle { padding: 16, paddingBottom: 100 }
  MyListingsScreen.tsx:73, 111     — { gap: 8 }, { padding: 16, paddingBottom: 100 }
  SearchScreen.tsx:82              — contentContainerStyle { padding: 16, paddingBottom: 100 }

PostAd Wizard:
  StepCategory.tsx:38              — contentContainerStyle { padding: 16 }
  StepDetails.tsx:32               — contentContainerStyle { padding: 16, paddingBottom: 32 }
  StepImages.tsx:66                — contentContainerStyle { padding: 16, paddingBottom: 32 }
  StepPreview.tsx:26               — contentContainerStyle { padding: 16, paddingBottom: 32 }
```

**When to fix**: Sprint 3  
**Estimated effort**: 1 PR, 10 files, 2–3 hours  
**Blocking dependency**: None

---

### TD-004 — ChatThreadScreen KAV flex: 1 (Architecture Review Required)

**Evidence**: inline-style-audit.md — "#1: deferred review → ChatThreadScreen KAV `flex: 1`"

**Current Impact**: `KeyboardAvoidingView style={{ flex: 1 }}` on line 116. Borderline — could be static (migrate) or KAV-owned (exception).

**Risk**: Low — single line; no visual impact either way

**When to fix**: Sprint 3 — resolve during inline style migration PR  
**Estimated effort**: 30 minutes architecture review  
**Blocking dependency**: Architecture decision on KAV ownership

---

## 3. Validation Actions

Manual verification not yet executed. Evidence: sprint-2-closing-report.md Verification Matrix — "⏳ PENDING / ⚠️ NOT VERIFIED".

---

### VA-001 — Visual QA: Web App (PR 3)

**Priority**: 🔴 High  
**Owner**: QA / Frontend  
**Status**: ⏳ PENDING  
**Evidence**: Closing Report — "Visual QA (PR 3 — Web) | ⏳ PENDING | Manual device test | Not yet executed"

**Environment**: Browser (Chrome, Safari, Firefox)  
**Devices**: Desktop 1440px, Tablet 768px, Mobile 375px  
**Dark Mode**: Required (CSS variable mapping must work in both modes)

**Screens to verify** (PR 3 touched CSS variables and Tailwind config):
- Homepage / Landing
- Search results
- Ad detail page
- Auth screens
- Any screen using `bg-background`, `text-foreground`, `border-border`

**Expected Result**: No visual regression from Sprint 2 CSS variable remapping. Colors match design spec.

**Acceptance Criteria**
- [ ] All Tailwind color utilities resolve to correct semantic token values
- [ ] Dark mode CSS variables apply correctly
- [ ] No color regression on any verified screen
- [ ] Result documented: PASS / FAIL with screenshots

---

### VA-002 — Visual QA: Mobile App (PR 4)

**Priority**: 🔴 High  
**Owner**: QA / Mobile  
**Status**: ⏳ PENDING  
**Evidence**: Closing Report — "Visual QA (PR 4 — Mobile) | ⏳ PENDING | Manual device test | Not yet executed"

**Environment**: iOS Simulator + Android Emulator  
**Devices**: iPhone 14 (iOS 17), Pixel 7 (Android 14)  
**Dark Mode**: Required

**Screens to verify** (PR 4 wired NativeWind to tokens; PR 5/6 migrated StyleSheets):
- All 13 files migrated in PR 5
- All 3 files migrated in PR 6
- Navigation / MainTabs

**Expected Result**: No visual regression. Token-sourced colors match previous hex literals.

**Acceptance Criteria**
- [ ] NativeWind className utilities resolve to correct token values
- [ ] StyleSheet semantic token references render correctly
- [ ] Dark mode applies correctly
- [ ] No color regression on any verified screen
- [ ] Result documented: PASS / FAIL with device screenshots

---

### VA-003 — Mobile Build Verification

**Priority**: 🟡 High  
**Owner**: Platform Engineer  
**Status**: ⚠️ NOT VERIFIED  
**Evidence**: Closing Report — "Build | ⚠️ NOT VERIFIED | npm run build not executed | Mobile uses Metro bundler; full build deferred to Visual QA"

**Command to run**
```bash
# Metro bundle (dev)
cd apps/mobile && npx expo start --no-dev --minify

# Or production bundle
npx expo export
```

**Expected Result**: Bundle completes without errors. `@esparex/design-tokens` resolves correctly via symlink or npm.

**Acceptance Criteria**
- [ ] Metro bundle completes: 0 errors
- [ ] `@esparex/design-tokens` import resolves
- [ ] Build output documented

---

### VA-004 — Dark Mode Token Audit

**Priority**: 🟢 Low  
**Owner**: QA / Frontend  
**Status**: NOT IN SCOPE Sprint 2 (deferred)  
**Evidence**: sprint-2-closing-report.md — "Dark mode audit | No regressions reported but unverified"

**Scope**: Verify `semantic.dark.*` token values render correctly across all migrated screens.

**Expected Result**: All dark mode colors are semantically correct. No literal-sourced dark mode styles remain.

---

## 4. Documentation Actions

---

### DA-001 — Write ADR-D004 Document

**Priority**: 🔴 Critical (follows IA-001)  
**Owner**: Architecture  
**Status**: Blocked — awaiting design decision

**Evidence**: decision-register.md — "ADR Template" section; D-004 — "Pending"

**File to create**
```
docs/architecture/adr/ADR-004-action-color.md
```

**Contents required** (from ADR template in decision-register.md):
- Context: brand primary vs action color divergence
- Decision: chosen option (A, B, or C)
- Alternatives considered with rejection reasons
- Consequences: breaking changes, visual regression scope
- Verification: how to confirm correct implementation
- Rollback: how to revert

---

### DA-002 — Update Token Catalog After ADR-D004

**Priority**: 🟡 High (follows DA-001)  
**Owner**: Platform Engineer  
**Status**: Deferred — blocked by ADR

**File to update**
```
docs/design-system/token-catalog.md
```

**Required additions**:
- `semantic.light.action` entry (value, usage, PR introduced, platform support)
- Mark `base.action` as promoted (or document as internal primitive only)

---

### DA-003 — Update Engineering Action Register (Sprint 3 EAs)

**Priority**: 🟢 Ongoing  
**Owner**: Implementation Engineer  
**Status**: Pending — Sprint 3 not started

**Rule**: Every Sprint 3 engineering action must produce a new EA-NNN entry in `docs/tracking/engineering-action-register.md`. Entries begin from EA-019.

---

### DA-004 — Update Decision Register (Sprint 3 Decisions)

**Priority**: 🟢 Ongoing  
**Owner**: Architecture  
**Status**: Pending — Sprint 3 not started

**Rule**: Every Sprint 3 architectural decision must produce a new D-NNN entry in `docs/architecture/decision-register.md`. Entries begin from D-009.

---

## Action Register

| ID | Action | Owner | Priority | Sprint | Blocking | Status |
|----|--------|-------|----------|--------|----------|--------|
| IA-001 | Resolve ADR-D004: action color decision | Architecture + Design | 🔴 Critical | Sprint 3 Pre-work | Design team input | ⏳ Pending |
| IA-002 | Fix node_modules symlink (EA-017) | Platform | 🟡 High | Sprint 3 PR 0 | None | ⏳ Pending |
| TD-001 | Remove 9 ADR-blocked suppressions | Platform | 🟡 High | Sprint 3 | IA-001 | 🔴 Blocked |
| TD-002 | Resolve 13 token suppressions with PR 7 tokens | Platform | 🟡 Medium | Sprint 3 | None | ⏳ Pending |
| TD-003 | Migrate 13 inline styles (Chat, Listings, PostAd) | Platform | 🟡 Medium | Sprint 3 | None | ⏳ Pending |
| TD-004 | Resolve ChatThreadScreen KAV flex:1 | Platform | 🟢 Low | Sprint 3 | Architecture review | ⏳ Pending |
| VA-001 | Visual QA — Web (PR 3) | QA | 🔴 High | Sprint 3 | None | ⏳ PENDING |
| VA-002 | Visual QA — Mobile (PR 4, 5, 6) | QA | 🔴 High | Sprint 3 | None | ⏳ PENDING |
| VA-003 | Mobile build verification | Platform | 🟡 High | Sprint 3 | IA-002 | ⚠️ NOT VERIFIED |
| VA-004 | Dark mode token audit | QA | 🟢 Low | Sprint 3 | VA-002 | ⏳ Deferred |
| DA-001 | Write ADR-D004 document | Architecture | 🔴 Critical | Sprint 3 Pre-work | IA-001 | 🔴 Blocked |
| DA-002 | Update token catalog post-ADR | Platform | 🟡 High | Sprint 3 | DA-001 | 🔴 Blocked |
| DA-003 | Engineering Action Register — Sprint 3 EAs | Engineer | 🟢 Ongoing | Sprint 3 | None | ⏳ Pending |
| DA-004 | Decision Register — Sprint 3 decisions | Architecture | 🟢 Ongoing | Sprint 3 | None | ⏳ Pending |

---

## Dependency Graph

```
Design Team Decision
        ↓
  IA-001: ADR-D004 Written & Approved
        ↓
  DA-001: ADR-D004 Document Filed
        ↓
  TD-001: Remove 9 ADR-blocked suppressions
        ↓
  DA-002: Token Catalog Updated
        ↓
  VA-001: Visual QA — Web
  VA-002: Visual QA — Mobile          ←── IA-002: Symlink fix (parallel)
  VA-003: Build Verification
        ↓
  VA-004: Dark Mode Audit
        ↓
  Sprint 3 Closed


Independent (no blockers):

  TD-002: Resolve 13 token suppressions     ─────────────────┐
  TD-003: Migrate 13 inline styles          ────────────────┘ → Can begin immediately
```

---

## Risks

### 🔴 High

**Risk**: ADR-D004 stalls due to no design team escalation path.  
**Impact**: 9 suppressions remain indefinitely; `base.action` is never semantically promoted; action color drift continues.  
**Mitigation**: Time-box the ADR — if no design team input within 2 sprints, default to Option A (additive `semantic.light.action`) and document the decision.

**Risk**: node_modules symlink (EA-017) breaks on CI or new developer machine.  
**Impact**: `npx tsc --noEmit` fails; mobile development blocked.  
**Mitigation**: IA-002 should be the first action in Sprint 3 before any other code is written. Until resolved, add `ln -s` to the project README setup instructions.

### 🟡 Medium

**Risk**: Visual QA (VA-001, VA-002) uncovers CSS variable regression from PR 3.  
**Impact**: Web token mapping may have introduced color value changes not caught by type-check.  
**Mitigation**: Run Visual QA on all screens listed before closing Sprint 2 officially. If regression found, revert only `apps/web/globals.css` — the token package itself is unaffected.

**Risk**: 13 token suppressions (TD-002) replaced incorrectly — token shade doesn't match original hex.  
**Impact**: Visual change in status colors (e.g. `#16a34a` vs `#15803d`).  
**Mitigation**: Compare token values against original hex literals before replacing. Note any shade differences in the EA log. Apply per-file visual QA.

### 🟢 Low

**Risk**: ChatThreadScreen KAV `flex: 1` (TD-004) migrated incorrectly.  
**Impact**: Keyboard avoidance layout breaks in Chat thread.  
**Mitigation**: Test keyboard avoidance on iOS and Android after change. Rollback is a one-line revert.

---

## Sprint 3 Exit Criteria

A complete checklist. Sprint 3 is not closed until every item is checked.

**Infrastructure**
- [ ] IA-002: node_modules symlink resolved — `npm install` succeeds in clean environment
- [ ] VA-003: Mobile bundle completes without errors

**Architecture**
- [ ] IA-001: ADR-D004 approved
- [ ] DA-001: ADR-D004 document filed in `docs/architecture/adr/`
- [ ] D-004 status updated to Approved in decision-register.md

**Token Resolutions**
- [ ] TD-001: 9 ADR-blocked suppressions removed (requires IA-001)
- [ ] TD-002: 13 token suppressions replaced with semantic token references
- [ ] DA-002: token-catalog.md updated with `semantic.light.action`

**Inline Styles**
- [ ] TD-003: 13 inline style violations migrated to StyleSheet
- [ ] TD-004: ChatThreadScreen KAV resolved (migrate or permanent exception documented)

**Verification**
- [ ] VA-001: Visual QA — Web passed. PASS documented with screenshots.
- [ ] VA-002: Visual QA — Mobile passed. PASS documented with screenshots.
- [ ] VA-004: Dark mode audit completed

**Lint Baseline**
- [ ] `react-native/no-color-literals`: 0 (maintained)
- [ ] `react-native/no-inline-styles`: target ≤ 1 (ImageCarousel permanent exception only)
- [ ] Total errors: target ≤ 20 (removing 9 suppressions reduces count further)

**Documentation**
- [ ] Engineering Action Register updated with all Sprint 3 EAs (starting EA-019)
- [ ] Decision Register updated with all Sprint 3 decisions (starting D-009)
- [ ] Sprint 3 closing report produced in Engineering Action Prompt format
- [ ] Sprint 3 Engineering Action Plan produced for Sprint 4
