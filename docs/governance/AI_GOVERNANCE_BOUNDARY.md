# AI Governance Boundary

This is the Tier 5 Canonical Single Source of Truth (SSOT) defining the boundaries, isolation policies, and execution rules for developer AI assistance, runtime AI integrations, and local IDE prompt setups on the Esparex platform.

---

## 1. AI Prompt Isolation Boundary

To prevent AI assistants from silently introducing competing standards or conflicting rules, all AI prompt scopes are strictly bounded:

### 1.1 Non-Authoritative Status
- **Implementation Assistants Only**: System prompts, IDE instructions, and rulesets are strictly tools for code execution and formatting. They are **NOT** architectural authorities and have zero authority to define or override platform design.
- **Strict Canonical Reference**: AI prompts must never define independent enums, database lifecycle flows, API contracts, or location rules. They must explicitly point and defer to Tier 1 Canonical SSOTs (e.g. `DOMAIN_MODEL_SSOT.md`, `API_CONTRACT_SSOT.md`, `ARCHITECTURE_FLOW_SSOT.md`).
- **Conflict Resolution**: If an AI instruction or system prompt conflicts with a Tier 1 Canonical document, the Canonical document wins. The AI must stop execution and report the conflict.

---

## 2. One-Brain Rule & IDE Compatibility Layers

To prevent "prompt pollution" and duplicate instruction trees, the repository maintains exactly one AI brain configuration:

### 2.1 Authorized AI Governance Folder
The `/ai-governance` directory is the **only** authorized location for machine-readable context files (`AI_CONTEXT.json`) and prompt templates (`PROMPT_TEMPLATE.md`). No other instructions directory is allowed.

### 2.2 Local Tool File Restrictions
Local tool-specific configurations (e.g. `.cursorrules`, `frontend/.cursorrules`, `.antigravity.system.prompt.md`) are treated strictly as thin mirrors or pointers. 
- They must not carry independent governance logic.
- They must be generated or derive their rulesets directly from this boundary and core SSOTs.
- They must point developer agents directly to `/docs/MASTER_DOCUMENT_REGISTRY.md` to load active documentation.

---

## 3. Runtime Product AI Governance

The runtime AI systems executing within the Esparex application (e.g., automated listing review, text classification) are governed strictly by database models and source code:

- **Source Code Authority**: Product AI behaviors, prompts, and settings are owned by:
  - Route: `backend/src/routes/aiRoutes.ts`
  - Service: `backend/src/services/AiService.ts`
  - Model Config: `core/src/models/SystemConfig.ts`
- **Settings UI**: Moderation parameters, API keys, and model selections are mutated strictly through the Admin dashboard at `/settings/moderation`.
- **IDE Instruction Bounding**: Developer prompt instructions must never claim changes to runtime AI behavior or provider fallbacks without corresponding verified pull requests modifying the backend code.
