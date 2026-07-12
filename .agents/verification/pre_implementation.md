---
id: pre-implementation-verification
owner: verification
type: verification
version: 1.0
last_updated: 2026-07-12
depends_on: []
loads_when: ["*"]
---
# Pre-Implementation Confirmation Checklist

Before writing any code, confirm all of the following:

- [ ] **I am on a feature branch (NOT `main` or `develop`)** — confirmed by `git branch`.
- [ ] **A draft Pull Request is open on GitHub** and linked to the GitHub Issue.
- [ ] **The feature branch exists on remote** — confirmed by `git ls-remote`.
- [ ] I fully understand the requirement.
- [ ] I verified the existing implementation against the live source code.
- [ ] I understand how Esparex currently handles this concern.
- [ ] I am reusing or extending the existing implementation where possible.
- [ ] I am not introducing duplicate logic or parallel systems.
- [ ] I am not creating unnecessary files, folders, or documentation.
- [ ] The implementation follows the existing architecture and project standards.
