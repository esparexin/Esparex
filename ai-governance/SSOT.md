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

The authoritative order for AI governance is:

1. `ai-governance/SSOT.md`
2. `ai-governance/SOP.md`
3. `ai-governance/AI_CONTEXT.json`
4. Relevant canonical platform documents already defined in `docs/` and `SYSTEM_CONSTITUTION.md`
5. Runtime AI code ownership in the application codebase

Anything outside `ai-governance/` that contains AI instructions is non-authoritative unless this file explicitly designates it as canonical.

## 2. Platform Authority Mapping

AI governance does not replace platform architecture governance. For platform behavior, AI agents must follow:

1. `docs/00_README_ARCHITECTURE.md`
2. `SYSTEM_CONSTITUTION.md`
3. The relevant domain document in `docs/01` through `docs/07`
4. `docs/CONVENTIONS_*.md`
5. Package-level READMEs
6. Active migration plans such as `SSOT_REFACTOR.md`

This means:

- `ai-governance/` owns AI behavior
- `docs/` and `SYSTEM_CONSTITUTION.md` own platform behavior

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

### API Rules

- User application requests must go through the canonical user API client layer.
- Admin application requests must go through `adminFetch` or the canonical admin API client layer.
- React components must not introduce direct `fetch` or `axios` calls for app data access.
- Admin endpoints must never be called from user UI flows.
- API contract changes require explicit approval and versioning discipline.

### Database Rules

- Controllers must not own business logic that belongs in services.
- Controllers must not directly own database access when the service layer is the canonical owner.
- Raw `req.query` and privileged `req.body` objects must not be passed directly into database operations.
- Incoming ObjectIds must be validated before database access.
- Hard deletes are disallowed for governed domain data unless explicitly approved.

### Naming Rules

- New fields use `camelCase`.
- String identifiers end with `Id`.
- React component filenames use `PascalCase`.
- Service, controller, validator, utility, and helper files use `camelCase`.
- Model files use singular `PascalCase`.
- Container directories remain lowercase and typically plural.
- Admin UI lives in `admin-frontend`, not `frontend`.

### Enum and Contract Rules

- Shared enums, cross-app contracts, and reusable schemas belong in `shared/`.
- Frontend must mirror canonical payload and response contracts.
- AI tools must not introduce parallel enums, duplicate DTOs, or alternate field names.

### Business Logic Rules

- Business logic belongs in services.
- UI can change presentation, but must not silently change behavior.
- AI agents must not make speculative business-rule changes.
- Runtime AI prompts and provider behavior are code-owned by the runtime AI implementation, not by IDE prompt files.

## 5. Runtime AI Canonical Ownership

The runtime product AI system is currently OpenAI-backed and is owned by code, not by IDE prompt files.

Canonical runtime ownership:

- Route: `backend/src/routes/aiRoutes.ts`
- Controller: `backend/src/controllers/ai/aiController.ts`
- Validation: `backend/src/validators/ai.validator.ts`
- Service and prompts: `backend/src/services/AiService.ts`
- Runtime settings model: `backend/src/models/SystemConfig.ts`
- Admin runtime settings UI: `admin-frontend/src/app/(protected)/(system)/settings/components/ModerationSettings.tsx`

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

- Admin UI ownership: `admin-frontend` is canonical
- Component filenames: `PascalCase` is canonical for AI edits
- Runtime AI provider: OpenAI is canonical until runtime code changes
- Missing-file references such as `rules.md`, `GOVERNANCE.md`, and `CHANGE_PROOF.md` are non-authoritative and must not be treated as active SSOT inputs

## 8. Output Rule

Every AI-assisted change summary must state:

- files changed
- checks run or not run
- unresolved blockers or conflicts

