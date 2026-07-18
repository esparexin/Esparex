# Esparex Platform Master Roadmap

This roadmap defines the prioritization of work streams following the successful completion of the Contracts Migration milestone.

---

## Phase 1.1 — Proxy Removal & Warning Cleanup (Target: 1-2 days)

* **Objective:** Achieve zero Dependency Cruiser warnings and completely clean up the legacy contracts compatibility layer.
* **Deliverables:**
  - Audit and replace all imports of `@esparex/shared` targeting enums/schemas with `@esparex/contracts`.
  - Remove deprecated proxy re-exports from `shared/src/index.ts`.
  - Promote the Cruiser rule `no-new-legacy-shared-imports` from warning to error.
  - Recheck type integrity, verify that warnings drop to 0, and update baseline report.

---

## Phase 2 — Product Quality & UX Sprint (Target: 1 week)

* **Objective:** Polish key user-facing journeys and dashboard workflows to maximize engagement and maintainability.
* **Workstreams:**
  - **Post Ad Experience:** Streamline wizard steps, add autosave/draft recovery, resolve validation inconsistencies between client forms and backend validators, and optimize image upload loading states.
  - **Admin Dashboard:** Audit category/brand/model operations, clean up duplicate admin hooks, and remove legacy REST controllers.
  - **Events Module:** Finalize event creation forms, booking ticket availability state machine, and lifecycle consistency.

---

## Phase 3 — Continuous Governance & Testing (Target: Ongoing)

* **Objective:** Build robust QA gates and health metrics dashboard.
* **Deliverables:**
  - Run Repository Health Audit v2 to compile technical backlog.
  - Integrate Playwright end-to-end smoke test coverage for listing and checkout paths.
  - Implement automated visual regression checks for admin dashboard.
  - Establish CI checks to fail PRs on compilation errors or dependency violations.

---

## Phase 4 — Scale & AI Intelligence (Target: Long-Term)

* **Objective:** Leverage platform stability to ship advanced features.
* **Deliverables:**
  - AI-assisted catalog categorization from listing titles.
  - Automatic duplicate listing and spam detection.
  - Seller analytics dashboard and price suggestions engine.
