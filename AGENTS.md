# AGENTS.md — AI Agent Entry Point

**Status:** Active  
**Owner:** platform-team  
**Last Updated:** 2026-07-08  

This is the first file every AI agent should load when working on this repository. It defines how to discover context, find authoritative sources, and resolve conflicts.

---

## 1. Discovery Order

1. **docs/MASTER_DOCUMENT_REGISTRY.md** — Master SSOT of all documents. Every AI agent must start here.
2. **docs/governance/AI_GOVERNANCE_BOUNDARY.md** — Tier 5 AI governance boundary. Defines prompt isolation, One-Brain Rule, and conflict resolution.
3. **docs/ssot/** — 4 Tier 1 SSOTs: DOMAIN_MODEL, API_CONTRACT, ARCHITECTURE_FLOW, CI_CD.
4. **docs/governance/GOVERNANCE_POLICY.md** — Tier 3 engineering governance policy.
5. **.agents/brain/** — 12 brain modules (ERB-000 through ERB-011) for repository context.

---

## 2. Conflict Resolution

If two documents disagree:
1. Tier 1 SSOTs win over all other documents.
2. MASTER_DOCUMENT_REGISTRY.md is the single source of truth for which documents exist and their tier.
3. If a Tier 1 SSOT contradicts a governance rule, file an issue — do not silently override.
4. If an AI instruction conflicts with source code, source code wins — file an issue.

---

## 3. Constraints

- **No hardcoded API strings** — always reference shared route constants.
- **No lifecycle redefinition** — lifecycle statuses are SSOT in shared enums.
- **No duplicate implementations** — extend existing logic, never replace wholesale.
- **One-Brain Rule** — `.cursorrules` and `.antigravity.system.prompt.md` are thin pointers. No independent governance logic.

---

## 4. Validation Before Commit

- `npm run lint` — ESLint zero warnings
- `npm run type-check` — TypeScript pass
- `npm test` — Relevant workspace tests
- `npm run guard:dead-code` — No orphans
- `npm run docs:lint` — No broken doc references
