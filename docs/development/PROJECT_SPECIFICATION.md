# Esparex Project Specification

**Architecture Version:** `v1.0`  
**Latest Milestone:** `arch-milestone/contracts-migration-v1.0` (Contracts Migration Complete)

This document establishes the authoritative technical blueprint for the **Esparex Platform**. It defines the monorepo package layout, DDD bounded contexts, layer boundaries, data flow patterns, and active quality gates.

---

## 1. Monorepo Directory & Package Map

Esparex uses npm workspaces to manage code dependencies across layers:

* **`apps/` (UI Layer):** 
  - `web/`: Next.js web application (main marketplace and listings portal).
  - `admin/`: Next.js admin dashboard (operations, moderation, category management).
  - `mobile/`: Capacitor/React Native shell wrapper.
* **`backend/` (Delivery Layer):**
  - `api/`: Express REST API gateway. Coordinates endpoint routing and requests validation.
* **`core/` (Domain Logic & Persistence Layer):**
  - Contains bounded contexts (`core/src/domains/`), database adapters (`core/src/adapters/`), and composition DI setup (`core/src/composition/`).
* **`packages/` (Leaf and Utility Libraries):**
  - `contracts/`: Zod schemas, DTOs, events, and API contracts. (SSOT leaf package).
  - `kernel/`: Core DDD primitives (Result, Entity, ValueObject).
  - `observability/`: Tracing, audit logs, Sentry, OpenTelemetry metrics.
  - `config/`, `logger/`, `validation/`, `testing/`, `platform/`, `feature-flags/`.
* **`shared/` (Utility Layer):**
  - Core-independent, runtime-agnostic utilities (date math, location distances).
* **`docs/` (Documentation Hub):**
  - Architecture specifications, decisions (ADRs), and compliance reports.

---

## 2. Bounded Contexts & Bounded-Context Boundaries

Active domain logic currently lives in `core/src/domains/`. Subfolders in `packages/domain/*` are empty stubs reserved for future extraction.

* **Identity:** Core profiles, mobile bindings, verification states.
* **Authentication:** OTP SMS logins, session JWT tokens, refresh flows.
* **Catalog:** Categories hierarchy, brands, models, spare parts reference data.
* **Listings:** Ads creation, status lifecycles (active, pending, expired, rejected, moderated).
* **Location:** Geo-hierarchies, coordinates normalizations, geofencing.
* **Chat:** Buyer-seller P2P messages, read status indicators, block lists.
* **Payments:** Plan invoices, wallet transactions.

---

## 3. Data Flow Patterns & End-to-End Request Lifecycles

### 3.1 Post Ad Request Flow
1. **Frontend Input:** The user selects category, brand, model, and uploads images. Secure image URLs are fetched from `/api/v1/upload/ad-image` (AWS S3/Cloudinary upload adapter).
2. **Payload Validation:** The request payload is verified on the client via `AdPayloadSchema` (imported from `@esparex/contracts`).
3. **Gateway Routing:** The Express API gateway routes the POST `/api/v1/listings` request. It validates the body against the Zod schema contract before dispatching it to `ListingMutationController`.
4. **Service Execution:** The controller delegates to `ListingMutationService` inside `core`. The service resolves the database repository adapter via DI, performs catalog reference safety checks (via `CatalogValidationService`), and writes the `Ad` record.
5. **Background Indexing:** An integration event `AdCreated` is dispatched. A BullMQ worker receives it and syncs the listing to the search index.

### 3.2 Authentication & OTP Verification Flow
1. **OTP Request:** Client requests SMS -> POST `/api/v1/auth/request-otp`. Core `AuthService` stores token hash in Redis and triggers SMS provider.
2. **OTP Verification:** Client submits OTP -> POST `/api/v1/auth/verify-otp`. `AuthService` verifies token, registers session, and issues JWT access/refresh tokens.

---

## 4. Architecture Governance & Quality Gates

* **Leaf Contracts Isolation:** `@esparex/contracts` is a leaf package. It must never import from core, backend, apps, or shared. Enforced via `dependency-cruiser` (`contracts-is-independent` rule).
* **No Direct Core Imports in UI:** `apps/*` is forbidden from importing from `@esparex/core` directly, ensuring all backend requests go through REST APIs.
* **Mongoose Model Isolation:** Core services must never import database models directly. They must interact with DB schemas strictly via domain-defined Repository Ports (resolved at package composition boundaries).
