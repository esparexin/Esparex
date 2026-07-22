# Contributing & Development Workflow

This document outlines the Git branching strategy and engineering quality standards for the Esparex repository.

---

## 1. Git Branching Strategy

```text
main      → Production Target (Protected Release Branch)
develop   → Integration / Staging Branch (Canonical Source of Truth)
feat/*    → Feature Development
fix/*     → Bug & Defect Remediation
chore/*   → Governance, Tooling & Configuration
hotfix/*  → Emergency Production Fixes (PR → main + develop)
```

### Flow Rules

1. **All feature & bugfix branches originate from `develop`.**
2. **All PRs target `develop` by default.**
3. `main` is updated strictly via reviewed release PRs from `develop`.
4. Direct commits to `main` are strictly forbidden.

---

## 2. Pre-Change Verification Checklist

Before starting work on any feature or fix:

```bash
git fetch origin
git checkout develop
git pull origin develop
git checkout -b feat/issue-N-description
```

---

## 3. Quality & Verification Gates

Every Pull Request must pass the following verification gates before merge:

- **Type Check:** `npm run type-check` (0 errors across all workspaces)
- **Monorepo Build:** `npm run build` (0 build failures)
- **Automated Tests:** `npm test` (100% green status)
- **Accessibility:** WCAG 2.2 AA keyboard navigation & ARIA compliance (per `AGENTS.md`)

---

## 4. Environment Configuration

- **Local:** Managed via `.env.local` files in package/app directories.
- **Backend Services:** `render.yaml` (Render deployment schema). Secrets injected via dashboard (`sync: false`).
- **Frontend Applications:** Vercel deployment dashboards.
