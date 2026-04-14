# AI Audit Report

Status: Completed and normalized  
Audit Date: 2026-04-14

## 1. AI Brain Report

| Path | Purpose | Tool | Status | Classification |
|---|---|---|---|---|
| `ai-governance/SSOT.md` | AI governance source of truth | All | Active | Primary |
| `ai-governance/SOP.md` | AI operating procedure | All | Active | Primary |
| `ai-governance/AI_CONTEXT.json` | Machine-readable AI inventory | All | Active | Primary |
| `ai-governance/PROMPT_TEMPLATE.md` | Unified prompt template | All | Active | Primary |
| `.antigravity.system.prompt.md` | Local Antigravity prompt | Antigravity | Active local | Compatibility only |
| `.cursorrules` | Local Cursor repo rules | Cursor | Active local | Compatibility only |
| `frontend/.cursorrules` | Local frontend Cursor rules | Cursor | Active local | Compatibility only |
| `.claude/settings.local.json` | Local Claude permissions | Claude | Active local | Permissions only |
| `.kilo/rules.md` | Local Kilo rules | Kilo | Active local | Compatibility only |
| `.kombai/rules/Projectrule.md` | Local Kombai prompt | Kombai | Active local | Compatibility only |
| `.kombai/rules/kombai.config.yaml` | Local Kombai config | Kombai | Active local | Compatibility only |
| `.config/.commands/*.md` | Local command presets | Local IDE helpers | Active local | Legacy helper layer |
| `.config/.agent/workflows/*.md` | Local agent workflows | Local IDE helpers | Active local | Legacy helper layer |
| `backend/src/services/AiService.ts` | Runtime product AI logic and prompts | Product runtime | Active | Canonical runtime owner |

## 2. Duplicate Report

### Remaining compatibility overlap

- `.antigravityignore` and `.cursorignore`

### Duplicate cleanup completed in this workspace

- Removed `.config/.kilo/**`
- Removed `.config/.kombai/**`
- Removed `.config/.rohkun/**`
- Rewrote local wrappers so tool-specific files delegate to `ai-governance/*` instead of carrying separate repo logic

## 3. Conflict Report

### Resolved during consolidation

- `README.md` and the runtime code now agree that OpenAI is the active runtime AI provider.
- Local helper commands no longer define their own admin path or API-client policy; they delegate back to canonical governance.
- `docs/02_ENGINEERING_GOVERNANCE.md` now matches `docs/CONVENTIONS_NAMING.md` on `PascalCase` React component filenames.
- Tracked guidance no longer relies on missing `rules.md`, `GOVERNANCE.md`, or `CHANGE_PROOF.md` files.

### Active conflicts

- None found in tracked canonical docs or tracked enforcement scripts on 2026-04-14.

## 4. Dead File Report

### Removed from this workspace

- `.config/.rohkun/**`
- `.config/.kilo/**`
- `.config/.kombai/**`

### Remaining local-only files kept intentionally

- `.antigravity.system.prompt.md`
- `.cursorrules`
- `frontend/.cursorrules`
- `.claude/settings.local.json`
- `.kilo/**`
- `.kombai/**`
- `.config/.commands/**`
- `.config/.agent/workflows/**`

These are local ignored compatibility surfaces or permission files. They should stay non-authoritative until the corresponding IDE tool is retired or can load `ai-governance/*` directly.

## 5. Cleanup Plan

- Keep one versioned AI governance folder: `ai-governance/`
- Keep one SSOT: `ai-governance/SSOT.md`
- Keep one SOP: `ai-governance/SOP.md`
- Treat local tool files as compatibility surfaces only
- Keep authoritative AI governance changes inside `ai-governance/` and enforce that with `npm run guard:ai-governance`
- Retire remaining local wrappers only when the corresponding toolchain no longer needs them
