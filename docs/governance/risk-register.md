# Esparex Platform Risk Register (RISK-001)

**Purpose**: High-level lifecycle risk management register tracking active, mitigated, and closed risks across engineering, architecture, infrastructure, security, and release delivery.

---

## 1. Project Risk Register

| Risk ID | Risk Description | Probability | Impact | Mitigation Strategy | Owner | Status |
|:---:|---|:---:|:---:|---|:---:|:---:|
| **R-001** | Action Color (`#2563eb`) ADR resolution delayed | Medium | High | Filed `ADR-004-action-color.md` selecting Option A (`semantic.light.action = #2563eb`). Promoted to semantic tokens in Sprint 3 PR 4. | Architecture | ✅ Mitigated |
| **R-002** | Node engine version mismatch (`node 22.x` vs local Node `v26`) | Low | High | Relaxed `package.json` engines to `">=22"`. Patched CJS/ESM subpath exports across internal `metro-*` packages. | Platform | ✅ Mitigated |
| **R-003** | Local UI primitive duplication across apps & packages | Medium | High | Enforced >75% Similarity Threshold Rule (AGENTS.md). Consolidated primitives into `@esparex/ui` and forced 1-line pass-through re-exports in `apps/web`. | Frontend Lead | ✅ Mitigated |
| **R-004** | Metro export breakage going undetected on CI | High | High | Added mandatory `npx expo export --platform ios` and `--platform android` steps into `.github/workflows/ci.yml` (EA-026). | DevOps | ✅ Mitigated |
| **R-005** | High-density listing feed frame drops on low-end mobile devices | Medium | Medium | Established performance baselines in `baseline-report.md`. Scheduled `FlashList` migration for Sprint 5 Phase 1. | Mobile Lead | ⏳ In Progress |
| **R-006** | Third-party toast library proliferation violating popup SSOT | Medium | High | Enforced strict ban on external toast packages (AGENTS.md Section 13). All popups flow through single-instance `popupBus`. | Architecture | ✅ Mitigated |

---

## 2. Risk Evaluation Scale

- **Probability**: Low (<20%), Medium (20–50%), High (>50%)
- **Impact**: Low (minor delay / non-critical UI), Medium (component refactor required), High (build failure / API breakage / security vulnerability)
- **Status Lifecycle**: `Open` ──► `In Progress` ──► `Mitigated` ──► `Closed`
