# ADR-002: Knowledge Creation Rule

**Date:** 2026-07-12  
**Status:** Accepted

## Context
AI agents tend to generate excessive "planning," "scratch," and "audit" markdown files during execution. If left unchecked, the repository fills with dead-weight documentation that quickly goes stale and degrades search/context quality.

## Decision
We implemented strict **Knowledge Creation Rules** and **Skill Creation Rules** in `GOVERNANCE.md`. 
- New knowledge files can only be created if they are reusable across multiple tasks and contain concrete implementation details.
- A Skill can only be created after the AI has successfully executed a similar task at least 3 times.

## Consequences
- **Positive:** Prevents unstructured documentation dumps and keeps the architecture lean.
- **Negative:** Requires strict human enforcement and periodic Architecture Health audits to delete unauthorized files.
