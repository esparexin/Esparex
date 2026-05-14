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
4. Relevant canonical platform code and root workspace metadata
5. Runtime AI code ownership in the application codebase

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

### Documentation Registry Rules

- **Registry Mandatory**: Every new documentation file MUST be added to `docs/00-index.md` before merge.
- **Update-In-Place**: Always update existing canonical documents registered in `docs/00-index.md`. Never create duplicate `_final`, `_latest`, or `_v2` files.
- **Archiving**: Move superseded documents to `archive/legacy/YYYY-MM/` according to `docs/10-archive-policy.md`.
- **Banned Filenames**: Reject any file creation containing `final`, `latest`, `updated`, `copy`, `new`, `definitive`, `consolidated`, `backup`, `old`, `draft`, or `temp`.

### Platform Architecture Governance

For detailed rules on API, Database, Naming, and Frontend standards, AI agents MUST refer to the following canonical documents:

1. **API & Connectivity**: [docs/04-api-connectivity-map.md](../docs/04-api-connectivity-map.md)
2. **Database & Schema**: [docs/05-database-schema-ssot.md](../docs/05-database-schema-ssot.md)
3. **Frontend & Admin**: [docs/06-frontend-admin-standards.md](../docs/06-frontend-admin-standards.md)
4. **Developer Standards**: [docs/03-developer-standards.md](../docs/03-developer-standards.md)

**Mandatory Enforcement**: Every critical rule in these documents is validated by a corresponding script in `scripts/` and enforced in CI/CD via `npm run governance:all`.

### Runtime AI Prompts
- Runtime AI prompts and provider behavior are code-owned by the runtime AI implementation, not by IDE prompt files.

### Notification and Feedback Rules

- Do not use `toast.*` or the `sonner` package.
- Do not use legacy `notify.*` from `@/lib/notify`.
- Do not mount `<Toaster />` or any other toast providers.
- All client success feedback and error notifications must go through the centralized feedback system:
  - Canonical State Manager: `FeedbackSystemContext.tsx`
  - Canonical Event Dispatcher: `feedback.ts`
  - Canonical UI Rendering Layer: `SystemFeedbackBanners.tsx` (inline banners)
  - Code Review Checklist: Any new Sonner dependencies, direct toast invocations, or parallel toast notifications must be rejected.

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
