# Esparex Platform Master Roadmap

This roadmap defines the prioritization of work streams organized by key business Programs.

---

## Program 1 — Platform Foundation ✅
* **Status:** Completed
* **Focus:** Decoupling, Type safety, and boundary enforcement.
* **Deliverables:**
  - Decoupled `backend/api` from `core` (DDD Core separation).
  - Consolidated enums, DTOs, and schemas into `@esparex/contracts` (SSOT leaf).
  - Removed legacy folders from `@esparex/shared` (cleanup).
  - Setup automated pre-commit and routing guards (Husky, lint-staged).
  - Documented initial repository baseline.

---

## Program 2 — Product Excellence 🚀
* **Status:** Active
* **Focus:** User Journeys, Conversion funnels, Dashboard usability, and UX polish.
* **Active Projects:**
  - **Post Ad 2.0:** End-to-end audit and implementation of the listing creation wizard. Streamline selections (Category -> Brand -> Model -> Parts), improve image upload states, implement draft auto-recovery, and align Zod validation.
  - **Marketplace Browsing:** Optimize search filters, favorites watchlist, search matching performance, and Related listings.
  - **Admin Dashboard:** Restructure category metadata management workflows, simplify catalog operations to bulk actions, and clean up duplicate admin hooks.
  - **Events Module:** Complete event creation forms, booking ticket availability states, and event lifecycle integrations.

---

## Program 3 — Operational Excellence 📋
* **Status:** Planned
* **Focus:** Infrastructure reliability, telemetry, caching performance, and load testing.
* **Backlog Projects:**
  - Setup OpenTelemetry dashboards for Express REST latency and Mongoose queries.
  - Configure Sentry transaction tracking and BullMQ queue reliability metrics.
  - Audit Redis caching strategies to establish dedicated cache invalidate ports.
  - Conduct scale and API load testing drills.

---

## Program 4 — AI & Intelligence 🧠
* **Status:** Future
* **Focus:** Next-generation ML/AI integrations to drive seller velocity and marketplace safety.
* **Backlog Projects:**
  - Auto-categorize listings using semantic text embeddings of titles.
  - Match uploaded listing images against the spare-parts catalog reference database.
  - Implement real-time automated fraud/spam checks on listing creation.
  - Provide smart pricing suggestions to sellers based on historical marketplace data.
