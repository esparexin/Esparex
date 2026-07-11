# Repository Architecture Specification (SSOT)

**Workspace:** `esparex`  
**Classification:** Tier 3 Canonical Architecture SSOT  
**Authority:** Platform Architecture Board  

---

## 1. Core Architectural Principles

All development within the Esparex codebase must conform to the following core architectural design patterns:

* **Layered Architecture:** Clear vertical layers with distinct boundaries where outer layers depend only on inner layers, never the reverse.
* **Separation of Concerns:** Division of transport adapters (HTTP, Sockets) from core orchestrations, and core orchestrations from persistence layers.
* **Framework Independence:** The core domain logic is decoupled from runtime delivery frameworks (Express, Next.js).
* **Single Responsibility:** Each module, service, or handler has exactly one reason to change.
* **Dependency Inversion:** High-level policy (core business logic) does not depend on low-level details (transport/express routing or database engine configurations).
* **Composition over Inheritance:** Reusability is achieved through composition (e.g. orchestrators invoking multiple domain services) rather than inheritance chains.
* **Decoupled Business Rules (Lightweight DDD):** Business models and services encapsulate database mutations and invariant validation rules.

---

## 2. Repository Workspace Map

The Esparex codebase is organized as an **npm Workspaces** monorepo structured as follows:

```text
Esparex (Monorepo Root)
├── apps/                          # Frontend Applications Layer
│   ├── web/                       # Consumer Web Client (Next.js 16)
│   └── admin/                     # Back-office Admin Client (Next.js 16)
│
├── backend/                       # Delivery / Transport Layer
│   └── api/                       # REST / WebSocket API Gateway (Express 5)
│
├── core/                          # Domain Logic & Persistence Layer
│   ├── src/                       # Domain Services, Models, & Infrastructure
│   ├── tsconfig.json              # TypeScript compilation setup
│   └── package.json               # Core dependencies and package public exports map
│
├── shared/                        # Shared Contracts Layer
│   └── src/                       # Global Constants, Types, & Shared DTOs
│
├── docs/                          # Platform Documentation & SSOTs
│   ├── governance/                # Policy Standards & Audits
│   ├── ssot/                      # Domain Model & Flow SSOTs
│   └── decisions/                 # Architecture Decision Records (ADRs)
│
├── scripts/                       # CI Guards, Quality Gates, & Automation
│   └── policy/                    # Static analysis policies
│
├── package.json                   # Root workspace manifest
└── package-lock.json              # Lock file for npm workspaces
```

---

## 3. Layer Responsibility & Data Ingress

The platform is structured into five vertical execution boundaries. Each request flows sequentially through these layers:

```
          [ UI Client Layer ] (apps/web)
                   │
                   ▼
       [ Transport Adapter Layer ] (backend/api)
                   │
                   ▼
        [ Business Logic Layer ] (core/services)
                   │
                   ▼
       [ Persistence Model Layer ] (core/models)
                   │
                   ▼
     [ Infrastructure Layer ] (MongoDB, Redis, BullMQ)
```

* **UI Client Layer:** Renders screens, manages local state, and delegates networking to downstream REST APIs.
* **Transport Adapter Layer:** Directs request routing, handles Express-specific sessions, verifies CSRF/JWT tokens, and translates payloads into service calls.
* **Business Logic Layer:** Coordinates domain-level validations, computes business state transformations, and owns MongoDB transaction boundaries.
* **Persistence Model Layer:** Defines entity shapes, indexes database fields, and manages Mongoose configurations.
* **Infrastructure Layer:** Controls TCP connection pools, publishes async event queues, and hosts direct integration shims for external APIs.

---

## 4. Workspace Architecture Definitions

### 4.1 Applications Workspace (`apps/`)
* **Purpose:** Contains all user-facing presentation layers (Next.js web portals).
* **Why it exists:** Provides visual structure and user experience.
* **Why not inside `backend`:** Separating client UI from API gateways prevents client-side rendering engine updates from breaking service operations.
* **Who can import it:** Nobody (apps are the leaf endpoints of the dependency graph).
* **Who cannot import it:** All workspaces.
* **Deployment:** Vercel edge runtime environment.

### 4.2 API Gateway Workspace (`backend/api`)
* **Purpose:** Handles external REST API and WebSocket ingress traffic. Decodes authorization, enforces rate limits, parses payload shape, and delegates business tasks to core domain services.
* **Why it exists:** Adapts delivery concerns (CORS, Express, JWTs) before reaching the database or logic layers.
* **Why not inside `core`:** Separating transport logic from core business logic ensures that API gateway components can be refactored without breaking background worker processes or seed scripts.
* **Who can import it:** `apps/*` (indirectly via REST/WebSocket boundaries).
* **Who cannot import it:** `core`, `shared`.
* **Deployment:** Render container service.

### 4.3 Core Domain Workspace (`core`)
* **Purpose:** Coordinates business rules, transaction boundaries, Mongoose database connections, queue workers, and event processing.
* **Why it exists:** Houses the primary business engine and rules.
* **Why not inside `backend`:** Storing business policies in a standalone package ensures logic can be reused across REST APIs, BullMQ worker instances, and CLI seeder commands.
* **Who can import it:** `backend/api` (via package public exports).
* **Who cannot import it:** `apps/*` (direct import is banned), `shared` (leaf package).
* **Deployment:** Render container service (API context) & BullMQ workers.

### 4.4 Shared Contracts Workspace (`shared`)
* **Purpose:** Contains framework-agnostic contracts, TypeScript types, DTO validation schemas, enums, constants, and reusable utilities.
* **Why it exists:** Prevents type duplication across the client-server boundary.
* **Why not inside `core`:** Allowing UI client apps to access contracts without bringing in database dependencies or Mongoose packages.
* **Who can import it:** All workspaces.
* **Who cannot import it:** Nobody (shared is a pure leaf package).
* **Deployment:** None (compiled directly into consuming workspaces).

---

## 5. Monorepo Dependency Flow

All code imports and project boundaries must strictly follow the downstream dependency flow.

```
Allowed Downstream Dependency Flow:

Applications (apps/web, apps/admin)
                     │
                     ▼
       API Gateway (backend/api)
                     │
                     ▼
        Domain Engine (@esparex/core)
                     │
                     ▼
       Shared Contracts (@esparex/shared)
```

### 5.1 Forbidden Upstream Dependency Rules
To prevent architectural leaks, the following boundary crossings are strictly forbidden:
* **Forbidden:** `shared` ➔ `core`
* **Forbidden:** `core` ➔ `backend/api`
* **Forbidden:** `core` ➔ `apps`
* **Forbidden:** `backend/api` ➔ `apps`

---

## 6. Allowed Dependency Matrix

Imports crossing package boundaries are strictly controlled:

| Workspace | Allowed to Import From |
| :--- | :--- |
| `shared` | *Nobody (pure leaf)* |
| `core` | `shared` |
| `backend/api` | `core`, `shared` |
| `apps/*` | `shared` |

---

## 7. Concern Ownership & "Who Owns What"

The architectural concerns of the platform map to specific package boundaries:

| Concern | Owner |
| :--- | :--- |
| **Authentication (Session/JWT)** | `backend/api` |
| **Authorization (Ranks/Permissions)** | `core` (Services / Policy Guards) |
| **Payments (Razorpay Orchestration)** | `core` (PaymentProcessingService) |
| **Redis Connections & Caching** | `core` |
| **MongoDB Connection & Querying** | `core` |
| **HTTP Request/Response Handling** | `backend/api` |
| **Input Validation** | `backend/api` (HTTP Shape) + `core` (Business Invariants) |
| **Background Jobs (Workers)** | `core` (Queue Workers) |
| **UI State & Layouts** | `apps` |

---

## 8. Platform Business Domain Architecture

The platform consists of 8 core functional business domains mapped to specific folder paths inside `core/src/services/` and `core/src/models/`.

### 8.1 Domain Maps & Codebase Locations (Verified)
* **Authentication Domain**
  * Core Services: `core/src/services/AuthService.ts`
  * Mongoose Models: `core/src/models/User.ts`, `core/src/models/Otp.ts`
* **Users Domain**
  * Core Services: `core/src/services/UserService.ts`, `core/src/services/UserProfileService.ts`
  * Mongoose Models: `core/src/models/User.ts`, `core/src/models/Business.ts`
* **Marketplace Domain**
  * Core Services: `core/src/services/ad/`, `core/src/services/catalog/`
  * Mongoose Models: `core/src/models/Ad.ts`, `core/src/models/Category.ts`
* **Booking Domain**
  * Core Services: `core/src/services/PlanService.ts`, `core/src/services/AdSlotService.ts`
  * Mongoose Models: `core/src/models/UserPlan.ts`, `core/src/models/Plan.ts`
* **Payments Domain**
  * Core Services: `core/src/services/PaymentProcessingService.ts`, `core/src/services/wallet/`
  * Mongoose Models: `core/src/models/Transaction.ts`, `core/src/models/UserWallet.ts`
* **Notifications Domain**
  * Core Services: `core/src/services/notification/`
  * Mongoose Models: `core/src/models/Notification.ts`, `core/src/models/NotificationLog.ts`
* **Location Domain**
  * Core Services: `core/src/services/location/`
  * Mongoose Models: `core/src/models/Location.ts`
* **AI & Audit Domain**
  * Core Services: `core/src/services/AiService.ts`, `core/src/services/SpamDetectorService.ts`
  * Mongoose Models: `core/src/models/StatusHistory.ts`, `core/src/models/Report.ts`, `core/src/models/AdminLog.ts`

### 8.2 Internal Domain Dependency Rules

Inter-domain communication inside the `core` logic layer is strictly governed to prevent spaghetti dependencies:

```
[ Marketplace ] ──► [ AI / Moderation ] ──► [ S3 / Storage ]
      │
      ▼
[ Booking ] ─────► [ Payments ] ──────────► [ Notifications ]
      │                 │
      ▼                 ▼
[ Wallet ] ──────► [ Ledger ]
```

* **Permissible Domain Calls:**
  * `Booking` may call `Payments` (to authorize purchase checks) and `Wallet` (to deduct slots).
  * `Payments` may call `Notification` (to send receipts) and `Ledger` (to write audit records).
  * `Marketplace` may call `AI` (to filter spam text) and `Location` (to verify coordinates).
* **Forbidden Domain Calls:**
  * `Payments` is forbidden from importing or calling `Marketplace` or `AdService` (payments are ad-agnostic).
  * `AI` is forbidden from referencing `Booking` or `Payments`.
  * No domain service may import or depend on UI components, layouts, or gateway routers.

---

## 9. Execution & Communication Lifecycles

All interactions must flow downstream using specific communication channels.

### 9.1 Request Lifecycle (Request/Response Pipeline)

```
[ Browser Client ]
        │
        ▼ (HTTP REST Call)
Express Routing Gate (backend/api/src/routes/)
        │
        ▼ (Local Function call)
Middleware Pipeline (backend/api/src/middleware/ — CSRF, Auth, Rate Limits)
        │
        ▼ (Local Function call)
API Controller (backend/api/src/controllers/ — maps payload and decodes req context)
        │
        ▼ (Workspace Function call ➔ @esparex/core/services)
Domain Service (@esparex/core/src/services/ — executes business validation)
        │
        ▼ (Database session query)
Mongoose Model / Database Query (core/src/models/ ➔ MongoDB Atlas)
        ▼
Domain Service Response
        │
        ▼ (Local Function call)
API Controller formats envelope (calls local respond() / errorResponse())
        │
        ▼ (HTTP JSON Payload)
[ Browser Client ]
```

### 9.2 Event & Queue Lifecycle (Asynchronous Pipeline)

```
API Controller (Webhook Ingress / Mutation handler)
        │
        ▼ (Local Function call)
Domain Service executes mutation
        │
        ▼ (Workspace Function call ➔ @esparex/core/events)
Triggers Event Dispatcher (core/src/events/)
        │
        ▼ (Enqueue job helper)
Enqueues background task (core/src/queues/ — e.g. PaymentQueue)
        │
        ▼ (TCP Socket Connection)
BullMQ Worker Processes Job (core/src/workers/ — running out-of-band)
        │
        ▼ (HTTP API Call / SDK)
External API Invocations (Razorpay, SMS Gateway MSG91, AWS S3)
        │
        ▼ (FCM Push / WS Packets)
[ Browser Client ]
```

### 9.3 Error Propagation Flow

```
Domain Exception / Validation Failure (Thrown inside core/src/services/)
        │
        ▼
AppError raised (core/src/utils/AppError.ts — Framework-agnostic error object)
        │
        ▼ (Call Stack Bubble)
Propagates up the call stack to API Controller
        │
        ▼ (Try-Catch Handled)
Controller catches error and intercepts in NextFunction
        │
        ▼ (Local Function call)
Calls local sendErrorResponse() (backend/api/src/utils/errorResponse.ts)
        │
        ▼ (Casts to RFC 7807 contract)
Maps AppError code/status to client-safe RFC 7807 JSON payload
        │
        ▼ (HTTP Error Response)
[ Browser Client ]
```

### 9.4 Startup Lifecycle

```
Node Process Starts (backend/api/src/index.ts)
        │
        ▼
Load Environment Config (@esparex/core/config/loadEnv)
        │
        ▼
Establish Database Session Hook (core/config/db ➔ connectDB)
        │
        ▼
Establish Cache Connection (core/config/redis ➔ waitForRedisReady)
        │
        ▼
Register Event Bus Listeners (core/events ➔ initializeEventDispatcher)
        │
        ▼
Initialize BullMQ Job Schedulers (core/services/SchedulerBoot ➔ startScheduler)
        │
        ▼
Register HTTP Middlewares (backend/api/src/server.ts — CORS, Cookie Parser, rate limiters)
        │
        ▼
Mount REST Route Handlers (backend/api/src/routes/index.ts)
        │
        ▼
Launch Server Listener on PORT
```

---

## 10. Sequence Diagrams for Critical Business Flows

### 10.1 User Auth / Verification Flow
```text
Browser Client          API Router        AuthController      AuthService           OTP Service
     │                       │                  │                  │                     │
     │── POST /verify-otp ──>│                  │                  │                     │
     │                       │─── verifyOTP() ─>│                  │                     │
     │                       │                  │── verifyOTP() ──>│                     │
     │                       │                  │                  │── challengeOTP() ──>│
     │                       │                  │                  │<─── OTP_VALID ──────│
     │                       │                  │<── generateJWT()─│                     │
     │                       │<─ JSON (JWT) ────│                  │                     │
     │<── Cookie / Payload ──│                  │                  │                     │
```

### 10.2 Create Advertisement Flow
```text
Browser Client          AdController         AdService         GeminiAIService         MongoDB
     │                       │                   │                    │                   │
     │─── POST /listings ───>│                   │                    │                   │
     │                       │── createAd() ────>│                    │                   │
     │                       │                   │── checkSpamText()─>│                   │
     │                       │                   │<── TEXT_CLEAN ─────│                   │
     │                       │                   │───────────────────────────────────────>│
     │                       │                   │<────── Ad document created ────────────│
     │                       │<── Ad Payload ────│                                        │
     │<── HTTP 201 JSON ─────│                   │                                        │
```

### 10.3 Razorpay Payment Webhook Flow
```text
Razorpay Gateway        PaymentController     PaymentService      PlanService        Notifications
     │                          │                   │                  │                   │
     │── POST /webhooks/pay ───>│                   │                  │                   │
     │                          │── verifySign() ──>│                  │                   │
     │                          │── handleSuccess()>│                  │                   │
     │                          │                   │── activatePlan()>│                   │
     │                          │                   │                  │── addSlots() ────>│
     │                          │                   │                  │<── SLOTS_ADDED ───│
     │                          │                   │─────────────────────────────────────>│
     │                          │                   │<── Enqueue payment confirmation SMS ─│
     │<── HTTP 200 OK ──────────│                   │                                      │
```

---

## 11. Runtime Initialization & Deployment Architecture

### 11.1 Runtime Connections
* **`backend/api` Gateway owns:**
  * Express instance generation and HTTP server bindings.
  * CORS origin definitions and whitelist filters.
  * JWT verification and cookie parsing middleware.
  * Express REST API routing maps.
* **`@esparex/core` Engine owns:**
  * Mongoose connection pool initialization.
  * Redis socket connection pool verification.
  * BullMQ scheduler loops and queue workers.
  * Internal event dispatcher registries.

### 11.2 Environment Configurations Ownership
Environment variables are partitioned based on environment variables scope to prevent leakage:
* **Frontend Apps (`apps/`)** ➔ `NEXT_PUBLIC_API_URL` (Next.js client-bound)
* **API Gateway (`backend/api`)** ➔ `PORT`, `CORS_ORIGIN`, `COOKIE_DOMAIN`, `JWT_SECRET` (Express delivery)
* **Core Engine (`core`)** ➔ `MONGODB_URI`, `REDIS_URL`, `AWS_S3_*`, `RAZORPAY_*`, `GEMINI_*` (Domain/Infrastructure)

### 11.3 Deployment Topology
The physical hosting layers, deployment frameworks, and external dependencies map as follows:
* **Vercel Edge Hosting:** hosts `apps/web` and `apps/admin` frontend clients.
* **Render Application Hosting:** hosts `backend/api` Express gateway container instance.
* **MongoDB Atlas Database Cluster:** multi-tenant persistent storage.
* **Redis Cloud Server:** session state, locks, and query cache.
* **AWS S3 Buckets:** storage of listing images and document attachments.
* **External REST Providers:** Razorpay (Payments), ZeptoMail (SMTP), Gemini AI (Moderation).
