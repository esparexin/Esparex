---
id: api-contract-rule
owner: rules
type: rule
version: 1.0
last_updated: 2026-07-12
depends_on: []
loads_when: ["api", "endpoints", "rest", "controllers"]
status: active
confidence: stable
reviewed_on: 2026-07-12
review_frequency: quarterly
replaces: []
supersedes: []
tags: []
category: architecture
---
# API Contract Rules

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
