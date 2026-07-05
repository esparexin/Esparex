# Esparex Repository Directory Standard

This document defines the allowed contents, responsibilities, and internal templates for all directories in the Esparex repository.

---

## 1. Directory Inventory

All directories in this repository are restricted to the following purposes:

* **`apps/`**: Only deployable end-user client applications (Next.js web portal, admin portal, Capacitor native shells).
* **`backend/`**: Only API gateways and transport-layer servers (Express HTTP APIs, socket handlers).
* **`packages/`** (Future relocation target): Only internal reusable libraries (e.g. `@esparex/core`, `@esparex/shared`).
* **`docs/`**: Only human-readable documentation, SSOT logs, and architecture decision records.
* **`scripts/`**: Only build utilities, deployment lints, CI/CD tools, and migration helper scripts.
* **`tests/`**: Only cross-package E2E test scripts and multi-layer integration suites (e.g. Playwright workspace suites).
* **`.github/`**: Only GitHub Actions workflow files and pipeline configuration assets.

---

## 2. Workspace Package Templates

All new and refactored packages must adhere to the following internal directory structures to ensure consistency across the monorepo.

### 2.1 Reusable Library Template (e.g., `packages/core/`, `packages/shared/`)
```
packages/<name>/
├── src/
│   ├── index.ts           # Strict public API entry point
│   ├── [features]/        # Internal business modules/types
│   └── utils/             # Agnostic helper utilities
├── src/__tests__/         # Unit and integration tests (Jest)
├── package.json           # Declares workspace dependencies & exports
├── tsconfig.json          # Package-specific compiler configuration
├── README.md              # Documenting library purpose & API usage
└── LICENSE                # Workspace license
```

### 2.2 API Gateway Template (e.g., `backend/user/` / `backend/api/`)
```
backend/<name>/
├── src/
│   ├── app.ts             # Express application & setup
│   ├── server.ts          # Server bootstrap entry point
│   ├── routes/            # Route declarations & bindings
│   ├── controllers/       # HTTP controllers (Express req/res mapping)
│   ├── middleware/        # HTTP middlewares (rate limits, session guards)
│   └── config/            # Gateway environmental variables loading
├── src/__tests__/         # HTTP and integration spec tests (Jest)
├── package.json           # Workspace configurations
├── tsconfig.json          # TS config extending baseline settings
└── README.md              # API documentation and endpoints list
```

### 2.3 Deployable Frontend App Template (e.g., `apps/web/`, `apps/admin/`)
```
apps/<name>/
├── src/
│   ├── app/               # Next.js App Router folders (pages, API routes)
│   ├── components/        # Frontend UI view components
│   ├── hooks/             # Local React hooks (no backend code)
│   ├── context/           # Client-side React context state helpers
│   ├── styles/            # Vanilla CSS stylesheets & variables
│   └── utils/             # Agnostic browser-only helpers
├── src/__tests__/         # Frontend unit spec tests (Vitest)
├── tests/                 # E2E test suites (Playwright specs)
├── public/                # Static assets (images, fonts)
├── package.json           # Frontend dependencies
├── tsconfig.json          # Extended config mapping next types
├── next.config.mjs        # Next.js compilation settings
└── README.md              # Setup instructions
```
