# Architecture Evolution Log (Changelog)

This document chronologically records significant architectural transitions, structural reorganizations, and design updates in the Esparex codebase to maintain institutional knowledge.

---

## 📅 Architectural Index & Major Milestone Log

### [ADR-013] 2026-07-11: Post-Migration RCCA
* **Change:** Identified root causes for compilation failures in clean environments after controller extraction. Corrected linter path checks and export boundary guards.
* **Impact:** Clean pipelines and container startups compile successfully.
* **Reference:** [ADR-013](../decisions/ADR-013-migration-rcca.md)

### [F-02B] 2026-07-10: Single API Gateway Consolidation
* **Change:** Merged `backend/user` and `backend/admin` delivery workspaces into a unified `backend/api` workspace.
* **Reason:** Unified Express entrypoint handles incoming client-side (REST/WebSocket) and back-office admin operations under a single deployable server.
* **Impact:** Reduced infrastructure footprint and unified authentication and CORS middlewares.
* **Reference:** [ADR-010](../decisions/ADR-010-admin-refund-decomposition.md)

### [F-02A] 2026-07-08: Transport and Logic Separation
* **Change:** Extracted HTTP controllers, route definitions, and Express middlewares from the `@esparex/core` codebase to local delivery workspaces.
* **Reason:** Ensures core business services are framework-independent and pure. Banned direct database model imports in the gateway controllers.
* **Impact:** Decoupled business rules from Express router execution.
* **Reference:** [ADR-006](../decisions/ADR-006-public-contract-freeze.md)
