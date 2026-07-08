---
MetadataSchema: 1.0
Brain-ID: ERB-002
Title: Technology Stack
Version: 1.0
Status: Active
Type: Dynamic
Owner: Technology Inventory
Canonical: true
Last Updated: 2026-07-07
Confidence: High
Maintenance: Manual
Validation:
  - npm run docs:lint
  - npm run repository:doctor -- --profile ci
Relationships:
  documents:
    depends:
      - ERB-001
    impacts:
      - ERB-008
      - ERB-009
  repository:
    consumes:
      - package.json
      - package-lock.json
      - render.yaml
      - core/package.json
      - backend/user/package.json
      - apps/web/package.json
      - apps/admin/package.json
    owns:
      - Workspace Package Versions List
    validates:
      - Outdated Dependencies
      - Missing Environments Contracts
    generates:
      - Technology Inventory Context
---

# 02. Technology Stack

This document registers the verified technology stack catalog and specific version bounds across the workspaces.

## 1. Web Applications & Frameworks
* **Next.js**: version `^16.0.6` (React `^18.3.1`) — used in `@esparex/apps-web` and `@esparex/apps-admin`.
* **Express**: version `^5.2.1` — used in `@esparex/backend-user`.
* **TypeScript**: version `^5.9.3` for core/shared builds, and `^5.2.2` for app runtimes.

## 2. Databases & Storage
* **MongoDB**: version `^7.0.0` (Client).
* **Mongoose (ODM)**: version `^9.0.2`.
* **Database Migrations**: `migrate-mongo` version `^14.0.7`.
* **AWS S3**: `@aws-sdk/client-s3` version `^3.954.0`.

## 3. Caching & Queue Management
* **Redis Client (ioredis)**: version `^5.9.3`.
* **BullMQ (Queue)**: version `^5.70.1`.
* **Redis WebSockets Adapter**: `@socket.io/redis-adapter` version `^8.3.0`.

## 4. Integrations & Tooling
* **Razorpay SDK**: version `^2.9.6`.
* **Nodemailer**: version `^8.0.5`.
* **Firebase Admin**: version `^13.8.0`.
* **Prometheus Telemetry**: `prom-client` version `^15.1.3`.

## 5. Testing & Quality Control
* **Jest Runner**: version `^30.2.0` (with `ts-jest` `^29.4.6`).
* **Vitest Runner**: version `^4.0.16`.
* **Playwright**: version `^1.57.0`.

---

## 6. Evidence

* **Commit Fingerprint**: Verified against repo commit [d7e1faec](file:///c:/Users/Administrator/Documents/GitHub/Esparex)
* **Next.js Web**: [apps/web/package.json#L75](file:///c:/Users/Administrator/Documents/GitHub/Esparex/apps/web/package.json#L75)
* **Next.js Admin**: [apps/admin/package.json#L31](file:///c:/Users/Administrator/Documents/GitHub/Esparex/apps/admin/package.json#L31)
* **Express Backend**: [backend/user/package.json#L85](file:///c:/Users/Administrator/Documents/GitHub/Esparex/backend/user/package.json#L85)
* **MongoDB Client & Mongoose ODM**: [backend/user/package.json#L93-94](file:///c:/Users/Administrator/Documents/GitHub/Esparex/backend/user/package.json#L93-94) and [core/package.json#L53](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/package.json#L53)
* **Database Migrations**: [backend/user/package.json#L92](file:///c:/Users/Administrator/Documents/GitHub/Esparex/backend/user/package.json#L92)
* **S3 Storage Client**: [core/package.json#L34](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/package.json#L34)
* **Redis Cache client (ioredis)**: [core/package.json#L49](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/package.json#L49)
* **BullMQ Background queues**: [core/package.json#L46](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/package.json#L46)
* **WebSockets Redis Adapter**: [core/package.json#L41](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/package.json#L41)
* **Razorpay Payments SDK**: [core/package.json#L57](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/package.json#L57)
* **Nodemailer SMTP**: [core/package.json#L55](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/package.json#L55)
* **Firebase Notifications SDK**: [core/package.json#L48](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/package.json#L48)
* **Prometheus Telemetry (prom-client)**: [core/package.json#L56](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/package.json#L56)
* **Jest Test Runner**: [backend/user/package.json#L140](file:///c:/Users/Administrator/Documents/GitHub/Esparex/backend/user/package.json#L140) and [core/package.json#L72](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/package.json#L72)
* **Vitest Client Test Runner**: [apps/web/package.json#L115](file:///c:/Users/Administrator/Documents/GitHub/Esparex/apps/web/package.json#L115)
* **Playwright E2E browser**: [apps/web/package.json#L94](file:///c:/Users/Administrator/Documents/GitHub/Esparex/apps/web/package.json#L94) and [apps/admin/package.json#L40](file:///c:/Users/Administrator/Documents/GitHub/Esparex/apps/admin/package.json#L40)

---

## 7. Central Decisions References

* Central Decision Record: [0003-brain-system](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/decisions/0003-brain-system.md)

---

## 8. Decision History

* **v1.0 (2026-07-07)**: Initialized technology stack inventory.
