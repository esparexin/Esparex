# Esparex Project Principles

These principles serve as the decision-making framework for all developers, designers, and AI agents contributing to the Esparex Platform. When in doubt about an architectural pattern or product choice, refer to these values.

---

## 1. Product First
Architecture exists to enable product development and value delivery, not to become the product itself. Decoupling and refactoring must serve real product velocity or stability requirements, never pure aesthetic preference.

## 2. Audit First
Never implement before understanding. Always inspect active code, compile targets, and Git state before proposing or executing changes. Never guess the repository state based on outdated documentation.

## 3. Root Cause Analysis
Fix causes, not symptoms. When resolving test failures, type errors, or runtime bugs, identify the underlying architectural boundary violation or schema drift rather than applying local stubs or bypasses.

## 4. Single Source of Truth (SSOT)
Every responsibility, validation schema, or interface must have exactly one authoritative owner. Duplicate validation rules, constants, or types are forbidden. Contracts (`@esparex/contracts`) act as the absolute platform-wide SSOT for DTOs.

## 5. Mobile First
Every feature, modal, and flow must be designed and verified to work seamlessly on mobile browsers and within mobile Capacitor wraps. Desktop layouts are secondary.

## 6. Accessibility (WCAG AA)
We target a minimum compliance level of WCAG AA across both `apps/web` and `apps/admin`. High contrast, clean screen reader hierarchies, and clear keyboard focus indicators must be standard.

## 7. Security by Default
Validate everything at every boundary. Sanitize inputs, enforce authorization checks at both controller and service limits, and do not trust client-provided payloads.

## 8. Small, Reviewable PRs
Make incremental changes. Big commits delay integration and obscure regression sources. PRs must focus on a single issue number and contain complete test verification evidence.

## 9. Evidence Over Assumptions
All recommendations, audits, and code modifications must be supported by measurable, objective evidence (such as test suites passing, compiler outputs, or dependency cruiser validations).
