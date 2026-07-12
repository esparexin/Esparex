---
id: authorization-rule
owner: rules
type: rule
version: 1.0
last_updated: 2026-07-12
depends_on: ["authentication-rule"]
loads_when: ["roles", "permissions", "access-control", "security"]
status: active
confidence: stable
reviewed_on: 2026-07-12
review_frequency: quarterly
replaces: []
supersedes: []
tags: []
category: architecture
---
# Authorization Rules

Review against these security considerations:
- IDOR (Insecure Direct Object Reference) Prevention
- Role-based Access Control (RBAC) Enforcement
- Resource Ownership Checks
- CORS / CSRF Protection
- Principle of Least Privilege
