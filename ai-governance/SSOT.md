# AI Governance SSOT

Status: Active  
Effective Date: 2026-04-14  
Scope: All AI-assisted development workflows, AI tool instructions, and runtime AI ownership mapping in this repository

## Purpose

This file is the single source of truth for AI governance in Esparex.

It defines:

- where AI rules live
- which files are authoritative
- which local tool files are compatibility surfaces only
- how AI tools must map to the platform’s existing architecture and governance documents

## 1. Authority Model

1. **Layer 1: Master SSOT (Business)** -> `docs/01-business-blueprint.md`
2. **Layer 2: Engineering SOP** -> `docs/02-engineering-governance.md`
3. **Layer 3: Developer Standards** -> `docs/03-developer-standards.md` & `docs/06-frontend-admin-standards.md`
4. **Layer 4: API & Infra** -> `docs/04-api-connectivity-map.md`
5. **Layer 5: AI Execution** -> `ai-governance/SSOT.md` & `ai-governance/SOP.md`

Anything outside `ai-governance/` that contains AI instructions is non-authoritative unless this file explicitly designates it as canonical.

## 2. Platform Authority Mapping

AI governance does not replace platform architecture governance. For platform behavior, AI agents must follow:

1. `README.md`
2. `package.json`
3. The canonical implementation under `backend/src`, `frontend/src`, `apps/admin/src`, and `shared/`
4. Enforcement scripts under `scripts/`

This means:

- `ai-governance/` owns AI behavior
- the workspace code and guard scripts own platform behavior

## 3. One-Brain Rule

The repository must operate with one AI brain:

- One SSOT: `ai-governance/SSOT.md`
- One SOP: `ai-governance/SOP.md`
- One machine-readable context file: `ai-governance/AI_CONTEXT.json`
- One unified prompt template: `ai-governance/PROMPT_TEMPLATE.md`

Tool-specific files may exist only as compatibility layers for local IDEs or external tools. They must not define independent rules.

## 4. Canonical AI Rules

### System Rules

- No shadow AI governance docs outside `ai-governance/` should be treated as authoritative.
- AI agents must prefer the smaller, reviewable, less destructive change.
- AI agents must not invent alternate architectures, contracts, or ownership models.
- If rules conflict, the stricter and more specific rule wins until the conflict is harmonized in canonical docs.

### Platform Architecture Governance

For detailed rules on API, Database, Naming, and Frontend standards, AI agents MUST refer to the following canonical documents in the 5-layer hierarchy:

1. **Layer 1: Business** -> `docs/01-business-blueprint.md`
2. **Layer 2: Process** -> `docs/02-engineering-governance.md`
3. **Layer 3: Standards** -> `docs/03-developer-standards.md`, `docs/06-frontend-admin-standards.md`, `docs/11-security-compliance.md`
4. **Layer 4: Infra** -> `docs/04-api-connectivity-map.md`, `docs/05-database-schema-ssot.md`
5. **Layer 5: Archive & Registry** -> `docs/10-archive-policy.md`, `docs/00-index.md`

**Mandatory Enforcement**: Do not duplicate the rules defined in those files here. Rely on them as the canonical SSOT for those domains.


## 5. Runtime AI Canonical Ownership

The runtime product AI system is currently OpenAI-backed and is owned by code, not by IDE prompt files.

Canonical runtime ownership:

- Route: `backend/src/routes/aiRoutes.ts`
- Controller: `backend/src/controllers/ai/aiController.ts`
- Validation: `backend/src/validators/ai.validator.ts`
- Service and prompts: `backend/src/services/AiService.ts`
- Runtime settings model: `core/src/models/SystemConfig.ts`
- Admin runtime settings UI: `apps/admin/src/app/(protected)/(system)/settings/components/ModerationSettings.tsx`

Current runtime provider normalization:

- Runtime code uses OpenAI
- Admin settings expose OpenAI API key and model fields
- Repo docs must not claim Gemini as the active runtime AI provider unless code changes accordingly

## 6. Local Tool Files Policy

The following classes of files are compatibility surfaces only:

- ignored local IDE prompt files
- ignored local rule packs under `.config/`
- local permission files
- local generated analysis reports
- snippet files for editors

These files may exist for tool interoperability, but:

- they are not authoritative
- they must derive from `ai-governance/`
- they must not add conflicting instructions

## 7. Audit Normalizations

The following conflicts are resolved here for all AI agents:

- Admin UI ownership: `apps/admin` is canonical
- Component filenames: `PascalCase` is canonical for AI edits
- Runtime AI provider: OpenAI is canonical until runtime code changes
- Missing-file references such as `rules.md`, `GOVERNANCE.md`, and `CHANGE_PROOF.md` are non-authoritative and must not be treated as active SSOT inputs

## 8. Output Rule

Every AI-assisted change summary must state:

- files changed
- checks run or not run
- unresolved blockers or conflicts
