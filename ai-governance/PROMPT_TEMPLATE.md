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

1. **Layer 1: Master SSOT (Business)** -> `docs/01-business-blueprint.md`
2. **Layer 2: Engineering SOP** -> `docs/02-engineering-governance.md`
3. **Layer 3: Developer Standards** -> `docs/03-developer-standards.md` & `docs/06-frontend-admin-standards.md`
4. **Layer 4: API & Infra** -> `docs/04-api-connectivity-map.md`
5. **Layer 5: AI Execution** -> `ai-governance/SSOT.md` & `ai-governance/SOP.md`

Task:
<insert task>

Constraints:
- Do not invent alternate architecture or contracts.
- Prefer extending canonical owners over creating parallel modules.
- Keep changes small, reviewable, and behavior-safe.
- Refer strictly to the 5-layer documentation hierarchy for specific rules (e.g. Single UI Component Ownership, API Contracts, Authentication). Do not hallucinate or invent rules.
- Report files changed, checks run, and blockers.

If the task conflicts with canonical governance, stop and explain the conflict.
```

## Rule

Any tool-specific prompt should be a thin wrapper around this template. It must not carry an independent rule set.

