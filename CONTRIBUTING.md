# Contributing

## Scope
This repository prioritizes reuse, clear ownership, and safe incremental changes.

## Core Rules
- Do not copy-paste page scaffolding (table/filter/modal/action blocks) across features.
- If similar logic appears in 2 places, extract shared code in the same PR.
- Prefer shared locations:
  - UI primitives: `admin-frontend/src/components/**`
  - Reusable hooks: `admin-frontend/src/hooks/**`
  - API/query helpers: `admin-frontend/src/lib/api/**`
- Keep page files focused on page-specific business rules only.

## Required Checks (Before PR)
- `npm run type-check`
- `npm run guard:duplication`
- `npm run audit:orphans`

## PR Checklist
- [ ] No new duplicate scaffolding added.
- [ ] Reused existing primitives/hooks before creating new ones.
- [ ] Any new shared behavior extracted to a single source of truth.
- [ ] Removed dead/unused files introduced by refactor.
- [ ] Updated related docs if behavior/contracts changed.

## Review Standard
Reviewers should request changes for repeated blocks unless there is a documented, intentional reason to keep them separate.
