---
id: repository-discipline-rule
owner: rules
type: rule
version: 1.0
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
# Repository Discipline Rules

### Mandatory Rule
Before building, implementing, modifying, or creating anything, first understand how **Esparex already handles the same concern**.

Always ask:
> **"Does this already exist, and how is it currently implemented in Esparex?"**

Never assume. Never guess. Never create a new pattern until the existing implementation has been verified against the live source code.

### Existing Implementation Review
Before implementation, identify the canonical implementation in the current repository. Locate the existing implementation in the live repository and verify whether it can be reused or extended before creating anything new.

For every task, ask:
- How is this concern currently handled in Esparex?
- Is there already a shared solution for this?
- Can I extend it instead of creating something new?
- Will this introduce duplicate logic or a parallel pattern?
- Am I following the existing architecture?
