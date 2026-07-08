---
MetadataSchema: 1.0
Brain-ID: ERB-003
Title: Repository Structure
Version: 1.0
Status: Active
Type: Static
Owner: Repository Structure Map
Canonical: true
Last Updated: 2026-07-07
Confidence: High
Maintenance: Manual
Validation:
  - npm run docs:lint
Relationships:
  documents:
    depends:
      - ERB-001
    impacts:
      - ERB-004
      - ERB-009
  repository:
    consumes:
      - docs/MASTER_DOCUMENT_REGISTRY.md
      - docs/architecture/REPOSITORY_DIRECTORY_STANDARD.md
    owns:
      - Workspace Folder Classifications
      - Directory File Templates
    validates:
      - Duplicate Folders
      - Temporary Files Leftovers
    generates:
      - Repository Directory Structure Map
---

# 03. Repository Structure

This document registers folder structures, classification mapping, templates, and directory-level metadata.

## 1. Directory Classifications & Metadata

Root directories are classified to allow automated reasoning on their purpose:

| Directory Path | Classification | Purpose | Runtime | Language | Visibility | Repository Owner | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `apps/web` | Presentation Layer | Client application interface | Browser / SSR | TypeScript | Public | Web Application | Active |
| `apps/admin` | Presentation Layer | Metrics and configuration panels | Browser / SSR | TypeScript | Private | Admin Application | Active |
| `apps/mobile` | Presentation Layer | Capacitor native wrappers | iOS / Android | TypeScript | Public | Mobile Application | Active |
| `backend/user` | Runtime Layer | Server-side API endpoint routers | Node.js | TypeScript | Private | Transport Layer | Active |
| `core` | Domain Layer | Mongoose schemas and integrations | Node.js | TypeScript | Internal | Business Domain | Active |
| `shared` | Shared Layer | Common type definitions and schemas | Isomorphic | TypeScript | Public | Shared Library | Active |
| `packages/repository-governance` | Governance Layer | Repo lints and scoring tools | Node.js | TypeScript | Internal | Governance Platform | Active |
| `scripts` | Tooling Layer | Indexing, migration, and lint runner | Node.js / Shell | JS / TS | Internal | Tooling Layer | Active |
| `docs` | Documentation Layer | Platform SSOT standards | N/A | Markdown | Public | Documentation Layer | Active |
| `archive` | Historical Layer | Obsolete reports and RCA logs | N/A | Markdown | Internal | Historical Layer | Active |

---

## 2. Folder Templates

Agents creating new directories must structure files according to these canonical templates:

### 2.1 Web/Admin Applications (`apps/`)
```text
apps/<app-name>/src/
 ├── app/               # Next.js App Router endpoints, pages, and layouts
 ├── components/        # React components (further split by features/ui)
 ├── hooks/             # Custom React Hooks
 ├── lib/               # App-specific API interfaces and configs
 ├── styles/            # CSS Modules and global styles
 └── tests/             # Playwright / Vitest test files
```

### 2.2 Backend Gateway (`backend/`)
```text
backend/<service>/src/
 ├── controllers/       # Route request controllers (thin wrappers)
 ├── routes/            # REST API route setup files
 ├── middleware/        # JWT parsing, auth validation filters
 └── validators/        # Endpoint Zod schema validators
```

### 2.3 Business Domain Core (`core/`)
```text
core/src/
 ├── domain/            # Transport-neutral business algorithms
 ├── services/          # Multi-model mutation orchestrators
 ├── models/            # Mongoose schemas and MongoDB schemas
 ├── events/            # Queue publishers and event handlers
 ├── infrastructure/    # DB, Redis, BullMQ, and payment adapters
 └── jobs/              # Scheduled background workers
```

---

## 3. Folder Health Report

* **Duplicate Folders**: None found. Single instance configurations exist across the workspaces.
* **Temporary Folders**: None found. Intermediates (e.g. `.next`, `dist`, `coverage`) are ignored in git.
* **Generated Artifacts**: TS compilation files `tsconfig.tsbuildinfo` reside within packages and are excluded from git checkins.
* **Deprecated Folders**: [docs/deprecated/](file:///c:/Users/Administrator/Documents/GitHub/Esparex/docs/deprecated) contains deprecated markdown configurations.
* **Experimental Folders**: None found.
* **Large Folders**: [core/src/services/](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/src/services) contains 198+ compiled module files; candidate for micro-layer division.
* **Deep Nesting**: Folders are structured flat; maximum directory nesting does not exceed 3 levels deep under workspace roots.
* **Mixed Responsibility Folders**: [core/src/infrastructure/](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/src/infrastructure) contains multiple infrastructure connections but is separated clean into adapters subfolders (db, cache, telemetry, push, socket, etc.).

---

## 4. Evidence

* **Commit Fingerprint**: Verified against repo commit [d7e1faec](file:///c:/Users/Administrator/Documents/GitHub/Esparex)
* **Directory layout and namespaces config**: [docs/MASTER_DOCUMENT_REGISTRY.md](file:///c:/Users/Administrator/Documents/GitHub/Esparex/docs/MASTER_DOCUMENT_REGISTRY.md)
* **Ignored generated folders config**: [.gitignore](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.gitignore)
* **TS References build config**: [tsconfig.json#L34-40](file:///c:/Users/Administrator/Documents/GitHub/Esparex/tsconfig.json#L34-40)

---

## 5. Central Decisions References

* Central Decision Record: [0003-brain-system](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/decisions/0003-brain-system.md)

---

## 6. Decision History

* **v1.0 (2026-07-07)**: Initialized directory classification and templates structure.
