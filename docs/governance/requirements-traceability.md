# Requirements Traceability Matrix (RTM-001)

**Purpose**: High-level architectural audit ledger connecting **Requirement → Decision → Engineering Action → PR → Verification → Release Target**.

**Scope**: All platform capabilities across Web (`apps/web`), Admin (`apps/admin`), Mobile (`apps/mobile`), Core (`core`), Contracts (`packages/contracts`), and Infrastructure.

---

## 1. Requirements Traceability Matrix

| Req ID | Requirement Description | Decision Ref | Engineering Action(s) | Target PR / Phase | Verification Evidence | Release Target |
|:---:|---|:---:|:---:|:---:|---|:---:|
| **REQ-DS-01** | Design System Tokens SSOT | D-001 | EA-001 – EA-018 | Sprint 2 | `sprint-2-closing-report.md` | `v1.0.0` |
| **REQ-DS-02** | Zero Suppression Baseline | D-001, D-006 | EA-020, EA-021, EA-022, EA-024 | Sprint 3 (PR 1–4) | `sprint-3-verification-matrix.md` (0 suppressions) | `v1.0.0` |
| **REQ-DS-03** | Interactive Action Color Standardization | D-004, ADR-004 | EA-023, EA-024 | Sprint 3 (PR 4) | `ADR-004-action-color.md`, `colors.ts` | `v1.0.0` |
| **REQ-INF-01** | Node >=22 & Workspace Native Support | D-002 | EA-019 | Sprint 3 (PR 0) | Clean `npm install` without manual symlinks | `v1.0.0` |
| **REQ-INF-02** | Automated Production Bundle Verification | D-003 | EA-025, EA-026 | Sprint 3 / 4 (PR 0) | `npx expo export` iOS (3199) & Android (3200) | `v1.0.0` |
| **REQ-A11Y-01** | WCAG 2.2 AA Accessibility & Screen Readers | D-005 | EA-027 | Sprint 4 (PR 1) | `accessibility-audit.md` & `visual-qa-report.md` | `v1.0.0` |
| **REQ-ARCH-01** | Enterprise State Coverage Matrix | D-007 | EA-028 | Sprint 4 (PR 2) | `state-coverage-matrix.md` (9 system states) | `v1.0.0` |
| **REQ-ARCH-02** | Component Consolidation & Anti-Duplication | D-008 | EA-029 | Sprint 4 (PR 3) | `component-consolidation-audit.md` (>75% rule) | `v1.0.0` |
| **REQ-PERF-01** | CWV & Metro Performance Baselines | D-010 | EA-031 | Sprint 4 (PR 5) | `baseline-report.md` (LCP < 2.5s, CLS < 0.1) | `v1.0.0` |
| **REQ-REV-01** | Release Evidence Package Standard | D-009 | EA-033 | Sprint 4 / 5 | `docs/releases/release-v1.x.x/` standard | `v1.0.0` |

---

## 2. Traceability Maintenance Rules

1. Every new feature or architectural refactor must map to a unique **Req ID** (`REQ-*`).
2. No Engineering Action (`EA-*`) may be logged in `engineering-action-register.md` without an assigned Req ID.
3. Every PR must verify its mapped Requirement ID against the Quality Gate Register (`quality-gates.md`).
