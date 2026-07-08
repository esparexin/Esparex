# AI Governance Boundary

**Status:** Active  
**Tier:** Tier 5 — AI Boundary  
**Owner:** platform-team  
**Last Updated:** 2026-07-08  
**Supersedes:** MAD_AI_OPERATING_INSTRUCTIONS.md (archived)

This is the Tier 5 Canonical Single Source of Truth (SSOT) defining the boundaries, isolation policies, execution rules, and operating procedures for developer AI assistance, runtime AI integrations, and local IDE prompt setups on the Esparex platform.

---

## 1. AI Prompt Isolation Boundary

To prevent AI assistants from silently introducing competing standards or conflicting rules, all AI prompt scopes are strictly bounded:

### 1.1 Non-Authoritative Status
- **Implementation Assistants Only**: System prompts, IDE instructions, and rulesets are strictly tools for code execution and formatting. They are **NOT** architectural authorities and have zero authority to define or override platform design.
- **Strict Canonical Reference**: AI prompts must never define independent enums, database lifecycle flows, API contracts, or location rules. They must explicitly point and defer to Tier 1 Canonical SSOTs (e.g. `DOMAIN_MODEL_SSOT.md`, `API_CONTRACT_SSOT.md`, `ARCHITECTURE_FLOW_SSOT.md`).
- **Conflict Resolution**: If an AI instruction or system prompt conflicts with a Tier 1 Canonical document, the Canonical document wins. The AI must stop execution and report the conflict.

### 1.2 Core Principles
Always prioritize:
1. Correctness
2. Repository consistency
3. Maintainability
4. Security
5. Performance
6. Minimal change
7. Evidence-based decisions

Never optimize one objective by sacrificing another without explicitly explaining the trade-off.

### 1.3 Repository is the Source of Truth
Never invent APIs, components, folder structures, utilities, business rules, database fields, validation logic, or existing functionality.
If information is missing, search the repository, review similar implementations, inspect related modules, review governance documentation, then recommend.

### 1.4 Evidence First
Support findings with repository evidence. For every finding include: file(s), component/module, evidence, risk, impact, recommendation, priority. Clearly separate facts, assumptions, and recommendations.

---

## 2. One-Brain Rule & IDE Compatibility Layers

To prevent "prompt pollution" and duplicate instruction trees, the repository maintains exactly one AI brain configuration:

### 2.1 Authorized AI Governance Folder
The `/ai-governance` directory is the **only** authorized location for machine-readable context files (`AI_CONTEXT.json`) and prompt templates (`PROMPT_TEMPLATE.md`). No other instructions directory is allowed.

### 2.2 Local Tool File Restrictions
Local tool-specific configurations (e.g. `.cursorrules`, `.antigravity.system.prompt.md`) are treated strictly as thin mirrors or pointers. 
- They must not carry independent governance logic.
- They must be generated or derive their rulesets directly from this boundary and core SSOTs.
- They must point developer agents directly to `AGENTS.md` to load context.

---

## 3. Request Classification

Before acting, classify the request. Primary categories: New Feature, Bug Fix, Error Investigation, Code Audit, Code Review, Architecture Review, Repository Cleanup, Refactoring, Security Review, Performance Review, UI/UX Review, Documentation, Testing, Deployment. Select one primary and list secondary categories.

### Skill Routing
Load only minimum skills required. See `.agents/brain/09-Skill-Manifest.md` for the canonical skill taxonomy. Code-level skill implementations are in `packages/repository-skills/`.

### Required Workflow
Never begin implementation immediately. Always follow:
1. Understand the request
2. Classify the request
3. Load required skills
4. Audit existing implementation
5. Discover related modules
6. Explain current behavior
7. Explain desired behavior
8. Identify risks
9. Recommend solution(s)
10. Recommend the best approach
11. Wait for approval (unless explicitly instructed to implement)
12. Implement only the approved scope
13. Perform self-review
14. Describe testing requirements
15. Record unrelated findings as backlog items

---

## 4. Architecture & Repository Safety

Preserve package boundaries, shared library ownership, business logic ownership, validation ownership, authentication flow, API contracts, and domain ownership.

Never introduce scope creep, refactor unrelated files, rename files without justification, upgrade dependencies unnecessarily, remove code without proving it is unused, or change public APIs without downstream impact analysis. Prefer minimal, targeted changes.

---

## 5. Validation Before Commit

Before committing, run:
- `npm run lint` — ESLint zero warnings
- `npm run type-check` — TypeScript pass
- `npm test` — Relevant workspace tests
- `npm run guard:dead-code` — No orphans
- `npm run docs:lint` — No broken doc references

---

## 6. Runtime Product AI Governance

The runtime AI systems executing within the Esparex application (e.g., automated listing review, text classification) are governed strictly by database models and source code in `core/src/models/SystemConfig.ts`, `backend/user/src/routes/aiRoutes.ts`, and modification through the Admin dashboard at `/settings/moderation`.

---

## 7. AI Execution Flow

```
AGENTS.md -> MASTER_DOCUMENT_REGISTRY.md -> AI_GOVERNANCE_BOUNDARY.md
  -> docs/ssot/ (4 Tier 1 SSOTs)
  -> .agents/brain/ (12 ERB modules)
  -> repository-skills (code implementations)
  -> repository-runtime (CLI, 11 commands)
```

---

## 8. Success Criteria

A task is complete only when: repository has been understood, existing implementation has been audited, risks are documented, approved scope is implemented, testing requirements are identified, backlog items are separated, and repository architecture and governance remain intact.
