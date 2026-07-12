# ADR-003: Verification Separation

**Date:** 2026-07-12  
**Status:** Accepted

## Context
Previously, execution workflows, governance rules, and verification checklists were bundled into single monolithic documents. This made it difficult for the AI to understand when it should *read* a rule versus when it should *execute* a checklist.

## Decision
We strictly separated **Rules** from **Verification**. 
- `rules/` answers: *What are the constraints for this domain?*
- `verification/` answers: *How do I prove the work is complete and compliant?*

## Consequences
- **Positive:** Clearer agent execution phases. The AI applies rules during coding, and executes verification gates after coding.
- **Negative:** Slightly increases the number of files the Resolver must map.
