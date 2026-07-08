---
MetadataSchema: 1.0
Brain-ID: ERB-011
Title: Repository Vocabulary
Version: 1.0
Status: Active
Type: Static
Owner: Glossary Context Map
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
      - ERB-000
  repository:
    consumes:
      - docs/MASTER_DOCUMENT_REGISTRY.md
    owns:
      - Architectural Vocabulary definitions
      - Governance Platform terms list
    validates:
      - Naming Drift
    generates:
      - Glossary Context Map
---

# 11. Repository Vocabulary

This glossary defines the canonical naming and terminology used across the Esparex platform.

## 1. Architectural Terms
* **Transport**: The entry routing and protocol mapping layer (located in `backend/user`) handling HTTP REST routes and WebSocket gates.
* **Domain**: The core business logic layer containing pure calculations and workflows (located in `core/src/domain`).
* **Core**: The workspace encapsulating Mongoose schemas, services, adapters, database connections, and workers processes (located in `core/`).
* **Shared**: Isomorphic, isomorphic helper library containing common validation schemas (Zod) and constants (located in `shared/`).
* **Gateway**: Express routing gateways directing request vectors to core orchestrators.

---

## 2. Governance Platform Terms
* **Repository Doctor**: The programmatic command CLI tool (`repository-doctor`) executing lints.
* **Governance Engine**: The central quality compiler managing repo sanity audits (`packages/repository-governance`).
* **Analyzer**: An individual scanner collecting code statistics and payloads (e.g., `UnicodeHygieneAnalyzer`).
* **Validator**: A logic layer validating analyzer outputs against strict project configurations schemas.
* **Reporter**: Output managers (Console, JSON) summarizing test statuses.
* **Profile**: A validation preset mapping active rules (e.g., `ci` profile).
* **Health Score**: Quantitative repository quality metric (ranging from 0 to 100).

---

## 3. Evidence

* **Commit Fingerprint**: Verified against repo commit [d7e1faec](file:///c:/Users/Administrator/Documents/GitHub/Esparex)
* **Directory layout and classifications docs**: [docs/MASTER_DOCUMENT_REGISTRY.md](file:///c:/Users/Administrator/Documents/GitHub/Esparex/docs/MASTER_DOCUMENT_REGISTRY.md)
* **Governance packages naming**: [packages/repository-governance/package.json](file:///c:/Users/Administrator/Documents/GitHub/Esparex/packages/repository-governance/package.json)

---

## 4. Central Decisions References

* Central Decision Record: [0003-brain-system](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/decisions/0003-brain-system.md)

---

## 5. Decision History

* **v1.0 (2026-07-07)**: Initialized vocabulary definitions to ensure nomenclature alignment.
