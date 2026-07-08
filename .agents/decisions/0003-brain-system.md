# Central Decision Record: 0003-brain-system

* **Status**: Approved
* **Date**: 2026-07-07
* **Author**: Antigravity Technical Architect
* **Target Version**: v1.0

## Context & Problem
AI agents needed a modular, evidence-supported knowledge base to auto-initialize and load proper contexts without overloading active documentation folders or causing duplication.

## Decision
Established the Repository Brain System inside `.agents/brain/` organized into 12 distinct modules governed by strict YAML frontmatter metadata rules, evidence fingerprint tracking, and capability routing.

### Refined Boundaries Decoupling
To ensure high scalability, we codified the following invariants:
1. **Declarative Policies vs. Verification Algorithms**: The Brain owns declarative statements of *what* the rules are (e.g. "routes must be plural"); the Governance package owns the AST parser code and verification algorithms of *how* to enforce them.
2. **Canonical Invariant**: Every repository fact and policy must have exactly one canonical owner in the Brain.
3. **Acyclic Dependency Model**: Skills and Governance layers depend on the Brain API, but the Brain depends on nothing, ensuring a stable, isolation-friendly knowledge layer.
4. **Derived Authorship Principle**: The Brain is authoritative, but not necessarily authoritative by manual authorship. Facts should be programmatically derived from codebase configs (`package.json`, workflow yml) whenever possible, reserving manual edits for architectural intent, vocabularies, and declarative policies.

## Consequences
* Developer agents are guided by a unified, machine-readable repository map.
* Governance tools can programmatically parse repository states.
* Reduces maintenance overhead by programmatically deriving dynamic repository facts.
