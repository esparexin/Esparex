# Esparex Platform Master Roadmap

This roadmap defines the prioritization of work streams organized by key business Programs.

---

## Program 1 — Platform Foundation ✅
* **Status:** Completed
* **Focus:** Decoupling, Type safety, and boundary enforcement.
* **Deliverables:**
  - Decoupled `backend/api` from `core` (DDD Core separation).
  - Consolidated enums, DTOs, and schemas into `@esparex/contracts` (SSOT leaf).
  - Completed Milestones M2.1 (Payments), M2.2 (Notifications), M2.3 (Catalog), M2.4 (Identity), M2.5 (Listings), M2.6 (Fraud & Trust), and M2.7 (Boosts).
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
* **Status:** Active
* **Focus:** Infrastructure reliability, telemetry, caching performance, security audits, and load testing.
* **Deliverables:**
  - ✅ Backend Performance Phase 1 (Unbounded query pagination, SCAN replacement for KEYS in Redis, status mutation concurrency limits).
  - ✅ Database index validation (Compound index additions for Boost and AdAnalytics).
  - ✅ Frontend Performance Audit & Validation (Bundle analysis setup, route-level code splitting validation, dynamic chart loading).
* **Active Projects:**
  - **HTTP Security & CORS Audit:** Complete verification of the CORS policies, cookie structures, security headers, CSRF mechanisms, and authentication routes to identify and fix the ad posting failure.
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

