# Contributing to Esparex Platform

Thank you for contributing to the Esparex Platform monorepo! To maintain enterprise software quality and SSOT architecture across all packages, please follow these guidelines.

## Development Workflow & Rules

1. **Branch Naming**: All branches must follow `feat/issue-{N}-{description}`, `fix/issue-{N}-{description}`, or `chore/issue-{N}-{description}`.
2. **Single Responsibility PRs**: Each Pull Request must address a single problem category. Cross-cutting refactors or unapproved contract changes are prohibited.
3. **Repository Discovery First**: Search existing packages (`@esparex/contracts`, `@esparex/ui`, `@esparex/shared`) before writing new utility functions, schemas, or components.
4. **Mandatory Quality Gates**:
   Before submitting a Pull Request, ensure all quality gates pass locally:
   ```bash
   npm run type-check && npm run build && npm test && npm run contract:api && npm run repo:gate
   ```

## Pull Request Checklist

Refer to `.github/PULL_REQUEST_TEMPLATE.md` when submitting Pull Requests. Ensure all items in the checklist are verified.
