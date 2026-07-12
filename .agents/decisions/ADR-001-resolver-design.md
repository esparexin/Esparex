# ADR-001: Resolver Design

**Date:** 2026-07-12  
**Status:** Accepted

## Context
Initially, the AI workflow loaded all available context (skills, rules, governance) indiscriminately. This caused context window bloat, hallucinations, and conflicting instructions when the AI attempted to apply UI rules to Backend tasks.

## Decision
We implemented a **Resolver** (`RESOLVER.json` and `RESOLVER.md`) as the central intelligence node. The workflow now passes the task to the Resolver, which acts as a strict filtering matrix. The Resolver outputs only the exact rules, verification modules, and skills relevant to the specific task category.

## Consequences
- **Positive:** Context windows are highly focused. The AI receives only domain-relevant instructions.
- **Negative:** A new task type cannot be properly executed until it is manually mapped in the Resolver matrix.
