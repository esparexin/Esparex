# Ownership and Reference Boundaries

This document defines the clear boundaries of what the `esparex_engineering_stack` skill owns, what it references, and what it never duplicates.

---

## 1. Primary Ownership
This skill is the single source of truth (SSOT) for:
- Approved framework technologies (Next.js, Express, TypeScript).
- Approved npm packages, tooling, and database access configurations.
- Execution design flows (e.g. controller-to-service mapping).

---

## 2. External References
This skill references, but does **not** duplicate:
- **UI/UX & Styling Guidelines**: Refer directly to UI/UX and styling skill definitions (`ui_ux`). This skill only dictates whether Tailwind or CSS Modules are loaded, not visual guidelines like responsive breakpoints, color styling, or animations.
- **Workflow Steps**: Refer to `.agents/workflow/AI_WORKFLOW.md` for AI pipeline gates.
- **Global Governance Rules**: Refer to `.agents/governance/GOVERNANCE.md` for standard rules (like Live Repository First and minimal documentation rules).
- **Security Protocols**: Refer to Security Governance for JWT session parameters, CORS configuration arrays, or encryption standards.

---

## 3. Duplication Prohibition
- Do **not** copy lists of API endpoint URLs here.
- Do **not** duplicate Zod validation rules or database schemas here.
- Do **not** add deployment checklists.

This skill documents the repository's current engineering stack. It does not authorize technology changes, migrations, or dependency upgrades. Those decisions are governed through the project's governance process and approved architectural decisions.
