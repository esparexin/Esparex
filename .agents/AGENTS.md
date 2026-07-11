# Agent Rules & Constraints

Every developer AI agent executing in this workspace must load and obey the canonical governance policies as the single source of truth:

1. **Verification & Evidence Rules**:
   - Refer strictly to the evidence standards and checklists defined in [Verification Standard](file:///c:/Users/Administrator/Documents/GitHub/Esparex/docs/governance/VERIFICATION_STANDARD.md).
   - Never report a task as complete without verified, objective evidence.
2. **AI Prompts & Isolation boundaries**:
   - Obey the prompt isolation boundaries and non-authoritative status rules defined in [AI Governance Boundary](file:///c:/Users/Administrator/Documents/GitHub/Esparex/docs/governance/AI_GOVERNANCE_BOUNDARY.md).
3. **Engineering conventions & type safety**:
   - Adhere to casing, type-safety, and TypeScript constraints defined in the [Engineering Governance Policy](file:///c:/Users/Administrator/Documents/GitHub/Esparex/docs/governance/GOVERNANCE_POLICY.md).
4. **Architectural boundaries**:
   - Follow import boundary invariants and package public interfaces defined in the [Repository Governance Standard](file:///c:/Users/Administrator/Documents/GitHub/Esparex/docs/governance/REPOSITORY_GOVERNANCE_STANDARD.md).
5. **AI Execution Workflow**:
   - Before writing any code, load and execute every phase defined in [AI Execution Workflow](file:///c:/Users/Administrator/Documents/GitHub/Esparex/ai-governance/AI_EXECUTION_WORKFLOW.md).
   - Never skip, reorder, or bypass a mandatory phase gate. Stop immediately if any gate fails.
6. **Live Repository First**:
   - Never rely on documentation, Markdown files, comments, or prior analysis as evidence of current repository state.
   - All implementation decisions require direct inspection of the live source code and current git state.

