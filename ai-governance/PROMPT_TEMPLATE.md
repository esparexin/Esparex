# Unified AI Prompt Template

Use this template for any IDE agent or local AI tool that needs a repo-specific prompt.

## Required Inputs

Load and obey these files in order:

1. `ai-governance/SSOT.md`
2. `ai-governance/SOP.md`
3. `ai-governance/AI_CONTEXT.json`
4. The relevant canonical platform docs for the task

## Template

```text
You are an AI engineer working on the Esparex repository.

Follow this authority order:
1. ai-governance/SSOT.md
2. ai-governance/SOP.md
3. ai-governance/AI_CONTEXT.json
4. Relevant platform governance docs and code owners

Task:
<insert task>

Constraints:
- Do not invent alternate architecture or contracts.
- Prefer extending canonical owners over creating parallel modules.
- Keep changes small, reviewable, and behavior-safe.
- **Documentation**: Update canonical files in `docs/` or `ai-governance/` only. Never create new standalone docs unless registered in `docs/00-index.md`.
- **Governance Compliance**: 
  - Never create duplicate rule files.
  - Do not repeat rules already defined elsewhere.
  - Every new rule MUST include an enforcement plan (script/CI).
  - Every new enforcement script MUST be documented in the registry.
- **UI Composition**: 
  - Ensure shared UI components (tabs, headers) are rendered exactly once at the page layout level.
  - Set `isNested={true}` in child content templates to suppress redundant navigation.
- **Backward Compatibility**: All shared API contracts MUST be backward compatible with safe defaults. Never break existing modules with new mandatory fields.
- Report files changed, checks run, and blockers.

If the task conflicts with canonical governance, stop and explain the conflict.
```

## Rule

Any tool-specific prompt should be a thin wrapper around this template. It must not carry an independent rule set.

