# Quality Gate Register (GATE-001)

**Purpose**: Single Source of Truth for mandatory automated and manual checks required before any PR merge or production release sign-off.

---

## 1. Mandatory Quality Gate Register

| Quality Gate | Description & Verification Standard | Automated | Manual | Enforcement Tool | Merge Required |
|:---|---|:---:|:---:|---|:---:|
| **TypeScript Gate** | `npx tsc --noEmit` passes with 0 errors across all 11 workspace packages & apps | ✅ | — | `npm run type-check` | ✅ Mandatory |
| **ESLint Gate** | Zero active suppressions for `no-color-literals` and `no-inline-styles` | ✅ | — | `npm run lint` | ✅ Mandatory |
| **Unit Test Gate** | 100% test suite pass rate across `backend/api`, `@esparex/core`, and `apps/mobile` | ✅ | — | `npm test` | ✅ Mandatory |
| **Build Gate** | Clean compilation of Next.js Web, Admin, and package libraries | ✅ | — | `npm run build` | ✅ Mandatory |
| **Architecture Guard Gate** | Zero circular dependencies or broken project references | ✅ | — | `npm run guard:buildgraph` | ✅ Mandatory |
| **Production Bundle Gate** | `npx expo export` passes cleanly for iOS (3,199 modules) & Android (3,200 modules) | ✅ | — | Expo CLI Export | ✅ Mandatory |
| **Visual QA Gate** | 23 Viewport & Theme Matrices verified with commit SHA & artifact links | — | ✅ | `docs/audits/visual-qa-report.md` | ✅ Mandatory |
| **Accessibility Gate** | WCAG 2.2 AA compliance verified with `accessibilityRole` & focus ring checks | Partial | ✅ | `docs/audits/accessibility-audit.md` | ✅ Mandatory |
| **Performance Budget Gate** | LCP < 2.5s, CLS < 0.1, INP < 200ms, first-load JS < 128 kB | Partial | ✅ | `docs/performance/baseline-report.md` | ✅ Mandatory |
| **Release Evidence Gate** | Complete evidence bundle assembled under `docs/releases/release-v1.x.x/` | — | ✅ | Release Policy (`REV-001`) | ✅ Mandatory |

---

## 2. Quality Gate Enforcement Policy

1. **Zero Bypass Rule**: No quality gate may be bypassed, ignored, or suppressed to meet deadline constraints.
2. **Automated CI Failure**: Any pull request failing an automated gate (`TypeScript`, `Build`, `Unit Tests`, `Architecture Guard`, `Bundle Export`) is automatically blocked by CI.
3. **Manual Gate Approval**: Manual gates (`Visual QA`, `Accessibility`, `Performance`, `Release Evidence`) require explicit sign-off in the PR description and `engineering-action-register.md`.
