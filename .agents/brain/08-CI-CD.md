---
MetadataSchema: 1.0
Brain-ID: ERB-008
Title: CI-CD
Version: 1.0
Status: Active
Type: Dynamic
Owner: Pipeline Validation Steps
Canonical: true
Last Updated: 2026-07-07
Confidence: High
Maintenance: Manual
Validation:
  - npm run docs:lint
Relationships:
  documents:
    depends:
      - ERB-002
    impacts:
      - ERB-010
  repository:
    consumes:
      - .github/workflows/ci.yml
      - render.yaml
      - apps/web/vercel.json
    owns:
      - Deployment Hosting Targets Configurations
      - CI Workflows Tasks List
    validates:
      - Environment Validation Failures
      - Test Suites compilation
    generates:
      - Pipeline Validation Steps
---

# 08. CI-CD

This document details the pipeline validation workflow and cloud hosting targets.

## 1. Hosting Configurations
* **Web Client Application**: Hosted on **Vercel** (configured in [apps/web/vercel.json](file:///c:/Users/Administrator/Documents/GitHub/Esparex/apps/web/vercel.json)).
* **Admin Dashboard Application**: Hosted on **Vercel**.
* **Transport API Gateway**: Hosted on **Render** (configured in [render.yaml](file:///c:/Users/Administrator/Documents/GitHub/Esparex/render.yaml)).

---

## 2. GitHub Actions Workflow

The CI workflow is configured in [.github/workflows/ci.yml](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.github/workflows/ci.yml) and runs on push/pull request to `main`:

### 2.1 Job 1: Lint, Test, and Build Monorepo (`ci`)
1. **Checkout Code**: Fetches repo state using `actions/checkout@v4`.
2. **Node Setup**: Resolves Node v22 from `.nvmrc` using `actions/setup-node@v4`.
3. **Dependencies**: Executes `npm ci` (blocking Husky hooks via `HUSKY=0`).
4. **Environment Check**: Runs `npm run guard:env-contracts` to validate environmental safety configurations.
5. **Unicode hygiene**: Runs `npm run guard:unicode-hygiene`.
6. **Governance suite**: Runs `npm run governance:all` (performs ESLint checks, TypeScript checks, Jest unit tests, jscpd, and docs duplicates validation).
7. **Architecture limits check**: Runs `npm run architecture:check` to check for circular and deep imports.
8. **Verify Backend Artifact**: Confirms presence of compiled `backend/api/dist/index.js`.

### 2.2 Job 2: Playwright E2E Regression (`e2e-listing-edit`)
1. **Checkout & Node Setup**: Fetches code and resolves Node.
2. **Playwright drivers**: Installs chromium browser drivers via `playwright install`.
3. **Build web app**: Compiles `@esparex/apps-web`.
4. **Start Web Server**: Launches next server on port 3000.
5. **E2E test suite**: Executes Playwright regression tests (`edit-listing.spec.ts` under apps/web).

---

## 3. Evidence

* **Commit Fingerprint**: Verified against repo commit [d7e1faec](file:///c:/Users/Administrator/Documents/GitHub/Esparex)
* **GitHub Workflows**: [.github/workflows/ci.yml](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.github/workflows/ci.yml)
* **Render deployment config**: [render.yaml](file:///c:/Users/Administrator/Documents/GitHub/Esparex/render.yaml)
* **Vercel web deployment config**: [apps/web/vercel.json](file:///c:/Users/Administrator/Documents/GitHub/Esparex/apps/web/vercel.json)

---

## 4. Central Decisions References

* Central Decision Record: [0003-brain-system](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/decisions/0003-brain-system.md)

---

## 5. Decision History

* **v1.0 (2026-07-07)**: Initialized CI/CD workflow steps and hosting definitions.
