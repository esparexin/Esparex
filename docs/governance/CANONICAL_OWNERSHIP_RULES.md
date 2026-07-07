# Canonical Ownership Rules (ARCH-002)

## Objective
Establish strict architectural boundaries by assigning exactly **one canonical owner** to every architectural concern. Other packages must consume from the owner rather than redefine the logic, preventing the relocation of duplication.

---

## 1. API Contract Governance

| Rule | Definition |
| :--- | :--- |
| **Owner** | `@esparex/shared` (`src/types/api.ts`) |
| **Allowed Consumers** | `apps/web`, `apps/admin`, `core`, `backend/user` |
| **Forbidden Locations** | No duplicate DTOs or response shapes in backend or apps. |
| **Enforcement** | CI Validation (`verify-api-contract.js`) fails if multiple envelopes exist. |

**Standard:**
- **One response envelope**: `ApiResponse<T>`
- **One pagination envelope**: `PaginatedResponse<T>`
- **One error envelope**: `ApiErrorResponse`
- **One validation error format**: Standardized Zod error mapper in backend.

*(Note: `core/src/utils/apiResponse.ts` acts as the backend runtime **builder** for these shared types, adding tracing and serialization, but it does NOT redefine the network wire format).*

---

## 2. Validation & Zod Schemas

| Rule | Definition |
| :--- | :--- |
| **Owner (Shared Models)** | `@esparex/shared/src/schemas/` |
| **Owner (Backend Queries)**| `core/src/validators/` |
| **Owner (Frontend Forms)** | `apps/web/src/schemas/` |
| **Allowed Consumers** | Respective layers. Shared is consumed globally. |
| **Forbidden Locations** | A frontend form schema must not redefine a shared model. |
| **Enforcement** | `eslint-plugin-boundaries` and manual PR reviews. |

---

## 3. Entity Lifecycle & State Machines

| Rule | Definition |
| :--- | :--- |
| **Owner** | **Lifecycle Engine** (`core/src/models/` + State Machine logic) |
| **Allowed Consumers** | Workers, API, Feed Visibility Guards. |
| **Forbidden Locations** | Cron jobs, UI, or standalone scripts must not define state transitions manually. |
| **Enforcement** | `guard-platform-governance.js` blocks raw JS lifecycle mutations. |

**Standard:** Only one place defines lifecycle rules. Everything else consumes them.

---

## 4. Startup Dependencies & Health Classification

| Rule | Definition |
| :--- | :--- |
| **Owner** | `core/src/infrastructure/boot/StartupGate.ts` (To be implemented) |
| **Allowed Consumers** | `backend/user/src/server.ts`, `core/src/infrastructure/redis/index.ts` |
| **Enforcement** | Deployment Pipeline Gates. |

**Classification Standard:**
- **Critical**: Startup fails (`process.exit(1)`). Example: MongoDB, Environment Config.
- **Required**: Startup succeeds but reports `DEGRADED`. Example: Redis Cache, Redis Queues.
- **Optional**: Feature is disabled seamlessly. Example: Sentry.
- **External**: Retry independently. Example: External SMTP/SMS gateways.

---

## 5. Governance Infrastructure Ownership

| Concern | Canonical Owner |
| :--- | :--- |
| **ADRs** | `docs/decisions/` |
| **Environment Validation**| `core/src/config/env.ts` (Backend) |
| **CI Rules** | `.github/workflows/` |
| **Governance Scripts** | `scripts/governance/` |
| **Deployment Gates** | `scripts/ops/` |
