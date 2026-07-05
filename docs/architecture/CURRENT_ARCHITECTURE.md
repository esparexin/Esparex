# Current Architecture Report (Pre-Refactoring)

This document provides a comprehensive map of the Esparex repository's current architecture, package boundaries, dependency graph, and critical runtime workflows prior to starting Milestone 3 refactoring.

---

## 1. Current Package Graph & Structure
The monorepo currently contains five active workspaces:

```
Esparex (Root Workspace)
├── apps/
│   ├── web/               # Next.js customer-facing application
│   └── admin/             # Next.js back-office admin dashboard
├── backend/
│   └── user/              # API Gateway gateway (Express HTTP and Socket.io)
├── core/                  # Domain library (Models, Services, Queues, Workers)
└── shared/                # Cross-platform utility library (Types, Enums, Schemas)
```

---

## 2. Current Dependency Graph & Boundary Breaches
The static import flows currently look as follows:

```
   [apps/web]      [apps/admin]
        │               │
        │               ▼
        │         [@esparex/shared] ◄────── [React hook usePopupQueue] (Breach)
        ▼               ▲
  [backend/user]        │
        │               │
        ▼               │
  [@esparex/core] ──────┘
        │
        ▼
   [Express Type Dependencies] (Breach)
```

### Key Boundary Breaches:
1. **Express Leakage into `core`**: `@esparex/core` has Express controllers and Express middleware directories. This forces `@esparex/core` to depend on `@types/express` and `@bull-board/express` in its package dependencies.
2. **React Leakage into `shared`**: `@esparex/shared` exports `usePopupQueue.ts` which imports React lifecycle hooks (`useState`, `useEffect`). This pollutes the environment-agnostic library with browser UI code.
3. **Deep Imports**: Workspace components import deep internal files directly (e.g. `@esparex/core/dist/controllers/admin/system.js`) rather than resolving imports via the package index exports barrel (`src/index.ts`).

---

## 3. Current Request Flow
The default request execution path operates as follows:

```
Client Request (Web / Admin)
        │
        ▼
  API Ingress (backend/user/src/app.ts / port 5001)
        │
        ▼
  Route Dispatcher (backend/user/src/routes/)
        │
        ▼
  Core Express Controller (core/src/controllers/) [Breach: Transport Layer inside Core]
        │
        ▼
  Core Domain Service (core/src/services/)
        │
        ▼
  Data Access (core/src/models/ [Mongoose] / core/src/config/redis [Redis])
```

---

## 4. Current Authentication Flow
* **Standard User (Customer Portal)**:
  - Auth requests hit `backend/user/src/routes/authRoutes.ts`.
  - The routing handler calls local services to verify identities, issues JWT tokens signed via `jsonwebtoken` using `JWT_SECRET`.
  - Ingress request validation uses `authMiddleware.ts` located inside `core/src/middleware/`.
* **Admin (Back-office Dashboard)**:
  - Admin login route binds `backend/user/src/routes/adminRoutes.ts` to `adminSystem.adminLogin` in `core/src/controllers/admin/system`.
  - Secondary verification/OTP is routed to `admin2FAController.ts` (using `speakeasy`).
  - Session verification uses the `adminAuth.ts` middleware located inside `core/src/middleware/`.
  - CSRF verification uses `csrfProtection.ts` middleware located in `backend/user/src/middleware/`.

---

## 5. Current Payment Flow
* **Trigger**: A user initiates a plan subscription purchase or ad boost on the web portal.
* **Execution**:
  - Request routes to `backend/user/src/routes/paymentRoutes.ts`.
  - The gateway coordinates with `PlanService` in `core/src/services/` to verify plan durations, catalog pricing matrices, and limits.
  - Payment orchestration connects with the Razorpay API gateway via the `razorpay` client library loaded inside `core/src/services/`.
  - Transactions and payment records are committed via the `Transaction` and `Invoice` schemas in `core/src/models/`.

---

## 6. Current Chat Flow
* **Trigger**: A customer sends a chat message to a seller regarding an active classified ad.
* **Execution**:
  - Chat history requests route to `chatAdminController.ts` in `core/src/controllers/admin/chat/`.
  - Historical messages are retrieved from MongoDB using the `Chat` schema in `core/src/models/`.
  - Real-time messages are dispatched over WebSocket connections initialized by Socket.io in `backend/user/src/app.ts`.
  - Socket.io uses `@socket.io/redis-adapter` to publish message broadcasts across multiple API gateway nodes.

---

## 7. Current Notification Flow
* **Trigger**: A system event (e.g. ad approval, new chat message, or smart alert match) requests a notification dispatch.
* **Execution**:
  - The event calls the notification queue (`NotificationQueue.ts` / BullMQ) located inside `core/src/queues/`.
  - Background task worker processes (`notificationDeliveryWorker.ts` / BullMQ workers) pull jobs from the queue.
  - Workers fetch user notification settings, load the Firebase Admin SDK (`firebase-admin`), and dispatch push notifications using Firebase.

---

## 8. Current Upload Flow
* **Trigger**: A user uploads an image when posting a classified ad.
* **Execution**:
  - Next.js frontend pages call local API routes inside the web application (`apps/web/src/app/api/upload/ad-image/route.ts`).
  - Next.js server-side code uses the AWS S3 SDK (`@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`) to request presigned upload URLs.
  - The browser client uploads files directly to the S3 bucket via presigned POST actions.
  - The uploaded file key is saved into the MongoDB listing document via the `Ad` model inside `core/src/models/`.
