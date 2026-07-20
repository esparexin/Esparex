# Repository Discovery & Stewardship Prompt

Before performing any repository audit, feature implementation, refactoring, bug fixing, or recommendations in this workspace, you must adhere to the following sequence:

## 1. Read the Authority Specifications
First, inspect the active project specifications:
- Read [PROJECT_STATUS.md](../PROJECT_STATUS.md) to understand current sprints, priorities, and active branch state.
- Read [PROJECT_SPECIFICATION.md](../PROJECT_SPECIFICATION.md) to understand the package boundaries, domain boundaries, and data flow layers.
- Read [MASTER_ROADMAP.md](../MASTER_ROADMAP.md) to check aligned deliverables and backlogs.

## 2. Verify Against the Live Repository Codebase
- Do not assume documentation is fully up to date. Verify package boundaries, typescript configurations, and route structures by directly inspecting the live source code and git commit history.
- Run `git status` to verify working tree status.
- Run `npm run type-check` and verify tests pass before writing new code.

## 3. Adhere to Non-Negotiable Governance Rules
- Ensure `@esparex/contracts` remains a true leaf package with absolutely zero upstream or sibling dependencies (enforced by `dependency-cruiser`).
- Ensure no direct imports of database models leak into controllers or API delivery routers.
- Ensure new enums, schemas, and DTOs are declared in `@esparex/contracts` as the Single Source of Truth (SSOT).
