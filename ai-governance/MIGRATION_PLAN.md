# AI Governance Migration Plan

## Goal

Move from scattered AI instructions and local rule packs to one authoritative, versioned governance folder.

## Step-by-step

1. Completed: create `ai-governance/` and establish:
   - `SSOT.md`
   - `SOP.md`
   - `AI_CONTEXT.json`
   - `PROMPT_TEMPLATE.md`
   - `RULES/`
   - `AGENTS/`

2. Completed: repoint repository entry points:
   - update `README.md`
   - update `docs/00_README_ARCHITECTURE.md`

3. Completed: normalize known documentation conflicts:
   - runtime AI provider wording updated to OpenAI-backed runtime AI
   - React component naming normalized to `PascalCase`
   - tracked admin-path enforcement aligned to `admin-frontend`
   - stale references to missing governance files removed from tracked guidance

4. Completed: retire the old repo-root AI SOP:
   - remove `AI_CHANGE_SOP.md`

5. Completed: convert local tool files to thin wrappers:
   - `.antigravity.system.prompt.md`
   - `.cursorrules`
   - `frontend/.cursorrules`
   - `.kilo/rules.md`
   - `.kombai/rules/Projectrule.md`
   - `.kombai/rules/kombai.config.yaml`
   - `.config/.commands/*.md`

6. Completed: remove provable duplicate and stale local artifacts from this workspace:
   - delete `.config/.kilo/**`
   - delete `.config/.kombai/**`
   - delete `.config/.rohkun/**`

7. Completed: add enforcement:
   - add `scripts/enforce-ai-governance-ssot.js`
   - add `npm run guard:ai-governance`
   - chain the new guard into `guard:platform-governance`

8. Ongoing rule changes:
   - edit `ai-governance/SSOT.md` first if authority changes
   - edit `ai-governance/SOP.md` first if process changes
   - keep tool wrappers thin and non-authoritative

9. Optional future cleanup:
   - keep `.claude/settings.local.json` permissions-only
   - retire `.antigravity*`, `.cursor*`, `.kilo/*`, `.kombai/*`, and `.config/.commands/*` only when those IDE tools can load `ai-governance/*` directly or are no longer in use
