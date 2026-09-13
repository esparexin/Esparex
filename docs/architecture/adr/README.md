# Architectural Decision Records (ADRs)

This directory contains **Product, Feature, and UI/UX Architectural Decision Records** for the Esparex application tier.

---

## ADR Directory Separation (SSOT Guide)

The Esparex repository maintains two distinct categories of Architectural Decision Records to ensure strict separation between systemic monorepo governance and product-level domain/UI design decisions:

| Category | Location | Scope & Purpose | Examples |
| :--- | :--- | :--- | :--- |
| **Product & UI/UX PDRs** | `docs/architecture/adr/` *(This Directory)* | Product features, design system tokens, UI behavior, visual tokens, category hierarchy depth, and frontend feature specifications (prefixed with `PDR-*` to avoid numbering collisions with platform ADRs). | `PDR-001-action-color.md`, `PDR-002-category-hierarchy-depth.md` |
| **Monorepo System & Governance ADRs** | `.agents/decisions/` | Platform-level architecture, bounded context topology, dependency boundary enforcement, policy engine, and package relationships. | `ADR-006-adr-decision-lifecycle.md`, `ADR-007-monorepo-package-topology.md`, `ADR-008-domain-architecture-and-bounded-contexts.md` |

---

## When to Place ADRs Here (`docs/architecture/adr/`)

Place an ADR in this directory if the decision involves:
1. **Design System & Visual Affordances**: e.g., semantic color promotions, typography scales, spacing tokens.
2. **Product & UX Domain Rules**: e.g., category hierarchy depth limits, multi-step listing wizard stages, user profile display standards.
3. **Application-Specific Design Patterns**: e.g., Web or Admin layout implementations that do not alter monorepo package boundaries or dependency rules.

*Companion Document*: Cross-reference decisions placed here with the platform [Architecture Decision Register](../decision-register.md) using the `D-{sequential-number}` format.

---

## When to Place ADRs in `.agents/decisions/`

Place an ADR in `.agents/decisions/` if the decision involves:
1. Creating or retiring an npm workspace/package.
2. Modifying module boundaries or architectural rules in `.dependency-cruiser.js`.
3. Defining new domain bounded contexts in `@esparex/core`.
4. Monorepo-wide governance, CI/CD gates, or automated compliance enforcement rules.
5. See [.agents/decisions/ADR-006-adr-decision-lifecycle.md](../../../.agents/decisions/ADR-006-adr-decision-lifecycle.md) for detailed lifecycle requirements.
