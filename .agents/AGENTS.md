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

---

## Engineering Review Add-ons

> These are **supplementary review gates** applied during Phase 7 (Live Repository Discovery) and before Phase 12 (Implementation). They do **not** replace, reorder, or bypass any phase of the existing AI Execution Workflow. Apply only when relevant to the change type.

### Mandatory Pre-Creation Question

Before creating **any** new artifact (file, hook, component, service, endpoint, schema, model, index, migration, enum, utility, or documentation), always answer:

> **Does this already exist in the project?**

- **Yes** → Reuse it. Extend it if needed. Do not create a duplicate.
- **No** → Verify thoroughly, justify why a new implementation is required, then implement.

---

### 7a. Security Review (apply to auth, API, user input, cookies, file uploads)

Review against:
- OWASP Top 10
- Authentication & Authorization
- Input Validation
- Rate Limiting
- CORS / CSRF / XSS
- Injection Prevention
- File Upload Security
- Security Headers
- Secure Cookies / JWT

---

### 7b. HTTP/API Review (apply to any API change)

Before creating a new endpoint, verify:
- Does an existing endpoint already cover this?
- Is an existing service reusable?
- Is existing middleware reusable?
- Is existing validation reusable?
- Is the existing response contract reusable?
- HTTP methods follow REST standards.
- Status codes are correct.
- Security headers are present.
- API versioning is respected.
- No duplicate endpoints are introduced.

---

### 7c. Database Review (apply to any schema, model, or data change)

Before creating new database objects, verify:
- Existing collection
- Existing schema / model
- Existing repository or service
- Existing migration
- Existing indexes
- Existing relationships
- Existing validators / enums

Do not create duplicate collections, schemas, models, indexes, or migrations.

---

### Repository Discipline (always active)

- Reuse before creating.
- Extend before duplicating.
- Refactor before replacing.
- Remove dead code before adding new code.
- Never create unnecessary files, folders, components, services, hooks, utilities, APIs, database objects, or documentation.
- Keep the repository clean and follow the existing architecture.
