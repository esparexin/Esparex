# ADR-004: Responsibility-Based Naming

**Date:** 2026-07-12  
**Status:** Accepted

## Context
Rule files were initially named after the current technology stack (e.g., `react.md`, `mongodb.md`, `security.md`). This tight coupling meant the architecture would break or become confusing if the technology stack evolved.

## Decision
We decoupled the architecture from the technology stack by renaming rule files to reflect the underlying **responsibility**. 
- `security.md` became `authentication.md` and `authorization.md`.
- `api.md` became `api_contract.md`.
- `database.md` became `data_persistence.md`.

## Consequences
- **Positive:** The rules outlive the specific framework choices. An `authentication.md` rule remains valid whether we use JWTs or OAuth.
- **Negative:** Requires developers to map their technological problems to abstract responsibilities when navigating the `.agents/` directory.
