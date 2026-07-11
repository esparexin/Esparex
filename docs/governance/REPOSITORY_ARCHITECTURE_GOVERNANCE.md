# Repository Architecture & Governance Hub

The single monolithic Esparex Architecture Handbook has been decomposed into three focused, canonical documents to maintain factual alignment with the live repository and support long-term scalability:

---

## 📂 Canonical Architecture Standards

### 1. 📘 [Repository Architecture Specification (SSOT)](REPOSITORY_ARCHITECTURE_SSOT.md)
*Houses the enduring architectural blueprints of the Esparex system.*
* **Contents:** Repository workspace map, layered responsibilities, monorepo dependency graph, concern ownership, business domain maps, request/event lifecycles, and deployment topologies.

### 2. 🛡️ [Repository Governance Standard & Boundary Rules](REPOSITORY_GOVERNANCE_STANDARD.md)
*Defines lint-enforced boundary constraints, coding policies, and architectural review gates.*
* **Contents:** Prohibited patterns, linter validation matrix, package stability tiers, encapsulation APIs, validator categories, and the pull request review checklist.

### 3. 📖 [Developer Handbook & Local Setup Guide](DEVELOPER_HANDBOOK.md)
*Acts as the step-by-step walkthrough for local environments, workflows, and implementation templates.*
* **Contents:** Local startup commands, test suite configurations, bottom-to-top feature checklists, placement maps, common coding mistakes, and the Definition of Done (DoD).

---

## 🏛️ Governance Exceptions & Postmortems
* **Architecture Decision Records:** Historical structural changes are archived under [docs/decisions/](../decisions/).
* **Incident Reports:** Root Cause & Corrective Action postmortems are tracked under [docs/decisions/ADR-013-migration-rcca.md](../decisions/ADR-013-migration-rcca.md).
