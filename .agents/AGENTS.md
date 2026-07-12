---
id: agents-bootstrap
owner: root
type: bootstrap
version: 2.0
last_updated: 2026-07-12
depends_on: []
loads_when: ["*"]
status: active
confidence: stable
reviewed_on: 2026-07-12
review_frequency: quarterly
replaces: []
supersedes: []
tags: []
category: architecture
---
# AGENTS.md

This repository uses modular AI governance.

Load in this order:

1. `governance/GOVERNANCE.md`
2. `workflow/AI_WORKFLOW.md`
3. `project/PROJECT_CONTEXT.json`

When required:
- Resolve Skills
- Resolve Rules
- Execute Workflow
- Run Verification

Never load unnecessary skills.
Never load unnecessary rules.
