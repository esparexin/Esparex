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

---

## Engineering Knowledge Review (Workflow Add-on)

> This is an additional review step applied during the Repository Audit and Architecture Audit phases. It does **not** modify or replace the existing workflow. Its purpose is to ensure every implementation understands and extends what Esparex already has, rather than creating parallel or duplicate systems.

### Mandatory Rule

Before building, implementing, modifying, or creating anything, first understand how **Esparex already handles the same concern**.

Always ask:

> **"Does this already exist, and how is it currently implemented in Esparex?"**

Never assume. Never guess. Never create a new pattern until the existing implementation has been verified against the live source code.

---

### Existing Implementation Review

Before implementation, identify the canonical implementation in the current repository. Do not assume file names or locations. During the Repository Audit and Architecture Audit, locate the existing implementation and verify whether it can be reused or extended before creating anything new.

For every task, ask:

- How is this concern currently handled in Esparex?
- Is there already a shared solution for this?
- Can I extend it instead of creating something new?
- Will this introduce duplicate logic or a parallel pattern?
- Am I following the existing architecture?

Apply this review to any area relevant to the task, including but not limited to:

- Error Handling
- Notifications
- Logging & Monitoring
- Security
- HTTP/API Design
- Database Design
- Performance & Caching
- Shared Components, Services, Hooks, and Utilities
- Middleware
- Queues and Background Jobs

---

### Reuse Before Create

Before creating any of the following, verify an existing implementation does not already exist:

- File, Folder, Component, Service, Hook, Utility, Middleware
- API Endpoint, Database Model, Schema, Migration
- Queue, Notification Handler, Error Handler

**If it exists:** Reuse it. Extend it if necessary. Keep the existing architecture consistent.

**If it does not exist:** Provide evidence it was searched for. Explain why a new implementation is required. Then implement.

---

### Pre-Implementation Confirmation Checklist

Before writing any code, confirm all of the following:

- [ ] I fully understand the requirement.
- [ ] I verified the existing implementation against the live source code.
- [ ] I understand how Esparex currently handles this concern.
- [ ] I am reusing or extending the existing implementation where possible.
- [ ] I am not introducing duplicate logic or parallel systems.
- [ ] I am not creating unnecessary files, folders, or documentation.
- [ ] The implementation follows the existing architecture and project standards.

**The current workflow remains unchanged. This review exists only to improve implementation quality and maintain consistency across the project.**

---

## Documentation Minimalism

- Do not create `.md` files unless they provide long-term value.
- Use a single temporary working report for audits.
- Present findings to the user before creating permanent documentation.
- After implementation is approved and completed, remove temporary reports.
- Reuse existing documentation whenever possible instead of creating new files.
- Avoid documentation duplication and stale reports.

