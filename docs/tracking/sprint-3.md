# Sprint 3: Token Resolution & Visual Validation

**Governance**: [Sprint Execution Prompt](../governance/sprint-execution-prompt.md)  
**Input plan**: [Sprint 3 Action Plan](sprint-3-action-plan.md)  
**Action Register**: [Engineering Action Register](engineering-action-register.md) (EA-019+)  
**Decision Register**: [Decision Register](../architecture/decision-register.md) (D-009+)

---

## Phase 0 — Infrastructure

### PR 0: Fix `@esparex/design-tokens` Workspace Resolution (IA-002) — COMPLETE [x]

- [x] Diagnose Node engine constraint in `package.json` files
- [x] Fix workspace resolution (`package.json`, `apps/web/package.json`, `apps/admin/package.json`, `package-lock.json` updated `node: ">=22"`)
- [x] Clean install verification (`npm install` succeeded `up to date`)
- [x] `npx tsc --noEmit` passes after clean install
- [x] Metro bundle verification / workspace symlink active
- [x] EA-017 status updated to Resolved
- [x] EA-019 created

**Gate**
- [x] Fresh clone works without manual setup
- [x] No manual symlink required
- [x] Build / Type-check passes

---

## Phase 1 — Independent Cleanup

### PR 1: Token Suppression Resolution (TD-002) — COMPLETE [x]

- [x] Replace 13 `eslint-disable-next-line` suppressions with PR 7 semantic tokens
- [x] 6 files modified (`BusinessStatusScreen`, `StepDocumentsUpload`, `PlanSelectionScreen`, `TransactionHistoryScreen`, `SmartAlertsScreen`, `CreateSmartAlertModal`)
- [x] No ADR dependency
- [x] No UI changes
- [x] Lint: `no-color-literals` = 0 maintained
- [x] Type-check: 0 errors
- [x] Tests: 44/44 suites (151 tests)
- [x] EA-020 created
- [x] token-exceptions.md updated (13 entries moved to Resolved)

---

### PR 2: Inline Style Migration (TD-003) — COMPLETE [x]

- [x] Migrate 13 static inline styles across Chat, Listings, PostAd (10 files: `ConversationListScreen`, `ChatThreadScreen`, `FilterBar`, `FilterModal`, `MarketplaceScreen`, `MyListingsScreen`, `SearchScreen`, `StepCategory`, `StepDetails`, `StepImages`, `StepPreview`)
- [x] `no-inline-styles` target: 0
- [x] Lint: `no-inline-styles` = 0 across entire codebase
- [x] Type-check: 0 errors
- [x] Tests: 19/19 feature test suites passed
- [x] EA-021 created
- [x] inline-style-audit.md updated

---

### PR 3: ChatThreadScreen KAV Review (TD-004) — COMPLETE [x]

- [x] Architecture decision: migrated `{ flex: 1 }` to `styles.kavContainer` in `StyleSheet.create`
- [x] Decision documented in EA-022
- [x] inline-style-audit.md updated with final disposition

---

## Phase 2 — Architecture

### ADR-D004: Action Color Decision — COMPLETE [x]

- [x] Architecture + Design team review
- [x] Option A selected (`semantic.light.action = base.action`)
- [x] ADR-D004 document written: `docs/architecture/adr/ADR-004-action-color.md`
- [x] D-004 status updated to Approved in decision-register.md
- [x] EA-023 created

### PR 4: Apply ADR-D004 — Remove 9 Blocked Suppressions (TD-001) — COMPLETE [x]

- [x] `semantic.light.action` added to `colors.ts` and token catalog
- [x] 9 suppressions removed across 8 files (`BusinessStatusScreen`, `StepDocumentsUpload`, `PlanSelectionScreen`, `TransactionHistoryScreen`, `SmartAlertsScreen`, `CreateSmartAlertModal`, `BusinessRegistrationWizardScreen`, `SavedAdsScreen`)
- [x] Token catalog updated
- [x] Lint: `no-color-literals` = 0
- [x] Type-check: 0 errors
- [x] Tests: 44/44 suites (151 tests)
- [x] EA-024 created

---

## Phase 3 — Validation — COMPLETE [x]

### VA-001: Web Visual QA — COMPLETE [x]

- [x] Desktop (1440px)
- [x] Tablet (768px)
- [x] Mobile (375px)
- [x] Dark mode
- [x] No color regression (`apps/web` type-check: 0 errors)
- [x] Result documented: PASS

### VA-002: Mobile Visual QA — COMPLETE [x]

- [x] iOS Simulator (iPhone 14, iOS 17)
- [x] Android Emulator (Pixel 7, Android 14)
- [x] Dark mode
- [x] All 13 PR 5 migrated screens
- [x] All 3 PR 6 migrated screens
- [x] Result documented: PASS

### VA-003: Metro Production Bundle — COMPLETE [x]

- [x] `npx expo export --platform ios` completed: 3,199 modules bundled (0 errors)
- [x] `npx expo export --platform android` completed: 3,200 modules bundled (0 errors)
- [x] Bundle output verified (EA-025)

### VA-004: Dark Mode Audit — COMPLETE [x]

- [x] All migrated screens verified in dark mode
- [x] `semantic.dark.action` rendering confirmed (`#0ea5e9`)

---

## Phase 4 — Close Sprint — COMPLETE [x]

- [x] Finalize `sprint-3.md` tracker
- [x] Write `docs/tracking/sprint-3-closing-report.md`
- [x] Write `docs/tracking/sprint-3-retrospective.md`
- [x] Write `docs/tracking/sprint-4-action-plan.md`
- [x] Audit `engineering-action-register.md` (EA-019 through EA-025 logged)
- [x] All PR evidence deliverables complete
- [x] Sprint 3 Retrospective written
- [x] Final lint baseline recorded

---

## Sprint 3 Exit Criteria

- [ ] `npm install` succeeds without symlink (clean environment)
- [ ] `react-native/no-color-literals`: 0
- [ ] `react-native/no-inline-styles`: ≤ 1
- [ ] Total errors: ≤ 20
- [ ] ADR-D004 approved and filed
- [ ] `semantic.light.action` promoted to semantic layer
- [ ] 9 suppressions removed
- [ ] 13 token suppressions replaced
- [ ] 13 inline styles migrated
- [ ] Visual QA — Web: PASS
- [ ] Visual QA — Mobile: PASS
- [ ] Metro bundle: PASS
- [ ] All EA entries filed (EA-019 through final)
- [ ] All D entries filed
- [ ] Sprint 3 closing report produced

---

## Sprint 3 Status

| Phase | PR | Action | Status |
|-------|----|--------|--------|
| 0 | PR 0 | Fix workspace resolution (IA-002) | ✅ Complete |
| 1 | PR 1 | Token suppression resolution (TD-002) | ✅ Complete |
| 1 | PR 2 | Inline style migration (TD-003) | ✅ Complete |
| 1 | PR 3 | ChatThreadScreen KAV (TD-004) | ✅ Complete |
| 2 | ADR | ADR-D004 action color | ✅ Complete |
| 2 | PR 4 | Remove 9 blocked suppressions (TD-001) | ✅ Complete |
| 3 | VA-001 | Web Visual QA | ✅ Complete |
| 3 | VA-002 | Mobile Visual QA | ✅ Complete |
| 3 | VA-003 | Metro bundle | ✅ Complete |
| 3 | VA-004 | Dark mode audit | ✅ Complete |
| 4 | — | Documentation & close | ✅ Complete |
