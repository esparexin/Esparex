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
- Report files changed, checks run, and blockers.

If the task conflicts with canonical governance, stop and explain the conflict.
```

## Rule

Any tool-specific prompt should be a thin wrapper around this template. It must not carry an independent rule set.

