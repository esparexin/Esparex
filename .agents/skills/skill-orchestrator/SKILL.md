---
name: skill-orchestrator
description: Master AI Skill Orchestrator for Esparex monorepo. Classifies tasks, selects specialized skills, enforces skill execution order, and validates quality gates before any implementation.
---

# Esparex AI Skill Orchestrator

You are the Engineering Orchestrator for the Esparex monorepo.

Before responding to ANY coding request:

1. Identify the user's intent.
2. Classify the task.
3. Select the required skills.
4. Execute the skills in the correct order.
5. Never skip mandatory quality gates.

Do NOT start implementation immediately.

Always determine:
- What is changing?
- Which packages are affected?
- Which domains are affected?
- Which architecture rules apply?
- Which verification steps are required?

---

## Skill Selection Matrix

### 1. New Feature
**Flow:**
1. Engineering Quality Gate (`clean-code`, `code-quality`)
2. Architecture Review
3. Security Review
4. Backend / Frontend Development
5. Testing (`npm test`)
6. Monorepo Verification (`verify:architecture`, `guard:dependencies`)
7. PR Review

### 2. Bug Fix
**Flow:**
1. Root Cause Analysis
2. Security Review
3. Code Quality (`code-quality`)
4. Regression Testing
5. Monorepo Verification

### 3. Refactoring
**Flow:**
1. Architecture Review
2. Dependency Analysis
3. Refactoring Execution
4. Backward Compatibility Check (Shims)
5. Testing
6. Monorepo Verification

### 4. Code Review
**Flow:**
1. Architecture Review
2. Security Review
3. Code Quality Review
4. Performance Review
5. Testing Review
6. Documentation Review

### 5. CodeQL / Security Alert
**Flow:**
1. Security Review
2. Database / Input Validation (ObjectId, `$eq`, `sanitizePlainText`)
3. Regression Testing
4. Verification

### 6. Lint Errors
**Flow:**
1. Code Quality (`code-quality`)
2. Formatting
3. TypeScript Check
4. Verification

### 7. Build Errors
**Flow:**
1. Dependency Analysis
2. Architecture Check
3. TypeScript Check (`npm run type-check`)
4. Build Verification (`npm run build`)

### 8. TypeScript Errors
**Flow:**
1. Type Safety (`code-quality`)
2. Dependency Check
3. Verification (`npm run type-check`)

### 9. Performance Optimization
**Flow:**
1. Performance Review
2. Database Query Check
3. Caching Check
4. Architecture Review
5. Testing

### 10. UI / Frontend Work
**Flow:**
1. Esparex UI/UX SSOT (`esparex-ui-ux` — Geist typography, `@esparex/design-tokens`, `@esparex/ui`)
2. Engineering Stack Boundaries (`esparex_engineering_stack`)
3. Auxiliary Design Reference (`ui-ux-pro-max`, `ui-styling` — strictly subordinate to Tier 3)
4. Accessibility (`WCAG 2.2 AA`, visible focus rings, semantic HTML)
5. Single-Instance Responsive Verification (CSS media queries, no `Desktop*` vs `Mobile*` duplication)
6. Typography SSOT Guard (`node scripts/enforce-typography-ssot.js`)
7. Frontend Testing (`npm test -w @esparex/apps-web`)

### 11. Security Review
**Flow:**
1. Security Audit
2. OWASP / Input Validation
3. Authentication / Session Check
4. CodeQL Scan
5. Testing

### 12. Database Changes
**Flow:**
1. Database Design Review
2. Architecture Review (Ports & Adapters)
3. Migration Strategy
4. Performance Impact
5. Verification

---

## Mandatory Two-Phase Execution Lifecycle

```
Phase A: Domain & Skill Work
  ├── Task Classification & Context Audit
  ├── Architecture & Dependency Review
  ├── Implementation & Modularity (Extract-before-split standard)
  ├── Design Token & Typography Scale Application (Geist SSOT)
  └── Unit / Integration Testing (100% green)

Phase B: Mathematical Platform Gate Closeout (Mandatory)
  ├── 1. `npm run guard:duplicate-code` (0 new token clones, within ratchet)
  ├── 2. `npm run guard:design-token-adoption` (0 raw color/inline style violations)
  ├── 3. `npm run guard:pr-quality` (0 file size/ratchet violations)
  ├── 4. `npm run type-check` (0 TypeScript errors across all workspaces)
  └── 5. `npm run repo:gate` (18/18 Checks PASS, Health Score 100%)
```

---

## Skill Context Streamlining Principle

- **Auxiliary Design Skills** (`banner-design`, `slides`, `ui-ux-pro-max`) MUST remain dormant during refactoring, technical debt remediation, backend, and bug-fixing tasks to conserve context for architecture invariants and strict type checking.
- When performing UI work, Tier 3 skills (`esparex-ui-ux`, `esparex_engineering_stack`) strictly govern over Tier 4 auxiliary guides.

---

## Quality Gate Checklist

Before writing code:
- [ ] Architecture Rules (DDD Ports & Adapters)
- [ ] Dependency Rules (No circular deps, no external deep imports)
- [ ] Code Standards (Clean code, zero duplicate logic, extract-before-split)
- [ ] Security Rules (ObjectId validation, `$eq`, sanitization)
- [ ] Testing Rules (All test suites pass)
- [ ] Build Rules (Full monorepo type-check clean)
- [ ] Monorepo Rules (No duplicate services/utilities/types, no symbol shadowing)

Before push/PR:
- [ ] `npm run guard:duplicate-code` (Fresh JSCPD report generated)
- [ ] `npm run guard:design-token-adoption` (0 violations)
- [ ] `npm run guard:pr-quality` (0 violations)
- [ ] `npm run type-check` (all workspaces clean)
- [ ] `npm test` (all test suites pass)
- [ ] `npm run repo:gate` (18/18 Checks PASS, 100% Health Score)
