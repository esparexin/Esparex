# Esparex Quality Enforcement Hierarchy & Bypass Policy

This document defines the authoritative quality enforcement pipeline across all local and CI entry points in the Esparex repository.

---

## The Single Quality Contract

> **One Repository → One Quality Gate (`npm run repo:gate`) → One Result**

All repository governance, SSOT validation, naming rules, platform governance, architecture platform checks, duplicate baselines, and dependency limits execute through a single consolidated orchestrator: **`npm run repo:gate`**.

---

## The 5-Tier Enforcement Hierarchy

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. Developer Local Execution (`npm run repo:gate`)          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Git pre-commit Hook (`.husky/pre-commit`)                │
│    • Lightweight formatting & lint-staged checks            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Git pre-push Hook (`.husky/pre-push`)                    │
│    • Mandatory `npm run repo:gate` execution                │
│    • Mandatory `type-check` & unit test suites              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. GitHub Actions CI (`.github/workflows/ci.yml`)           │
│    • Independent environment setup (`npm ci`)               │
│    • Mandatory `npm run repo:gate` execution                │
│    • Clean build & end-to-end integration tests           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Branch Protection (`main`, `develop`, `live`)            │
│    • Required status check on `ci.yml`                      │
│    • Block pull request merge if any gate check fails       │
└─────────────────────────────────────────────────────────────┘
```

---

## Local Bypass Procedure & Emergency Safeguards

### Local Hook Bypass (`git push --no-verify`)

In rare emergency situations (e.g. urgent hotfix deployment under incident management), developers can bypass local Git hooks using:

```bash
git push --no-verify
```

### Why GitHub Actions CI is the Final Authority

Because local Git hooks can be bypassed locally with `--no-verify`, **local hooks are not the sole line of defense**. 

GitHub Actions CI (`.github/workflows/ci.yml`) runs independently on GitHub infrastructure for every Push and Pull Request. Branch Protection rules mandate that the `ci.yml` status check must pass cleanly before any code can merge into `develop` or `main`.

Even if a developer uses `--no-verify` locally, non-compliant code will be caught and blocked by GitHub Actions CI.
