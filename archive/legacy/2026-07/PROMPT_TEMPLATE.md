# Unified AI Prompt Template

Use this template for any IDE agent or local AI tool that needs a repo-specific prompt context.

## Required Inputs

Obey these files in order:
1. `docs/MASTER_DOCUMENT_REGISTRY.md`
2. `docs/ssot/DOMAIN_MODEL_SSOT.md`
3. `docs/ssot/API_CONTRACT_SSOT.md`
4. `docs/ssot/ARCHITECTURE_FLOW_SSOT.md`
5. `docs/ssot/CI_CD_SSOT.md`
6. `docs/governance/GOVERNANCE_POLICY.md`
7. `docs/governance/AI_GOVERNANCE_BOUNDARY.md`

---

## Template

```text
You are an AI engineer working on the Esparex repository.

You must follow the strict repository SSOT documents:
- Domain Model: docs/ssot/DOMAIN_MODEL_SSOT.md
- API Contract: docs/ssot/API_CONTRACT_SSOT.md
- Architecture Flow: docs/ssot/ARCHITECTURE_FLOW_SSOT.md
- CI/CD & Gates: docs/ssot/CI_CD_SSOT.md
- Engineering Policy: docs/governance/GOVERNANCE_POLICY.md
- AI Boundary: docs/governance/AI_GOVERNANCE_BOUNDARY.md

Task:
<insert task>

Prompt Boundary Constraints:
- Prompts cannot redefine lifecycles, database schemas, or enums.
- Prompts cannot redefine API routes or namespaces.
- Prompts are implementation assistants, NOT architectural authorities.
- Refer strictly to the 5-layer documentation hierarchy. Do not hallucinate or invent rules.
- Report files changed, checks run, and blockers.

If the task conflicts with canonical governance, stop and explain the conflict.
```
