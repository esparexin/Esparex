# ADR-002: Theme Contract

**Status:** Accepted  
**Date:** 2026-07-06  
**Owner:** Platform  
**Deciders:** Engineering Lead

---

## Context

As the design system grows to support multiple products (MAD Entertrainment, Farmer Marketplace, CRM, etc.), each product needs its own visual theme. Without a formal contract, different themes will define different subsets of tokens, causing components to render incorrectly or fall back to browser defaults in some themes.

---

## Decision

A **Theme Contract** is established that defines the complete required set of CSS custom properties every theme must implement. See [THEME_CONTRACT.md](../../design-system/standards/THEME_CONTRACT.md) for the full specification.

Themes that satisfy the contract are guaranteed to work with all `@mad/ui` components. Themes that are missing tokens will surface as visual defects (missing colors, incorrect sizing).

In Phase 4, the contract will be enforced by an automated validator that runs as part of `pnpm governance:ui-baseline`.

---

## Consequences

**Positive:**
- Any new product theme is plug-and-play with the component library.
- Missing tokens are detectable early — in development, not in production.
- The `default` theme provides a complete neutral reference implementation.
- Future theme authors have a clear starting point.

**Negative:**
- Adding a new required token to the contract is a breaking change for all existing themes.
- Themes must be kept in sync with contract updates.

---

## Alternatives Considered

**Option A: No formal contract — themes define whatever they want**  
Rejected. Components would need per-token fallback values throughout all CSS, making maintenance very expensive and inconsistent.

**Option B: Inherit from a base theme file**  
Considered. CSS inheritance/cascade means child themes would need `@import` of the base first. This is possible, but makes it harder to audit what each theme defines. A contract with explicit token ownership is cleaner.
