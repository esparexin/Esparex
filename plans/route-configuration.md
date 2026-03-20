# Esparex Route Configuration Documentation

## 1. Backend Overview

Esparex uses Express.js with a modular, versioned routing architecture. The backend exposes public user APIs and isolated admin APIs with strict authentication, authorization, and rate-limiting controls.

### Architecture Principles
- Separation of Concerns: Controllers handle HTTP logic, services contain business logic
- Versioned APIs: All user-facing APIs are prefixed with `/api/v1`
- Admin Isolation: Admin APIs live under `/api/v1/admin` with separate auth and IP restrictions
- Security First: JWT authentication, IP allowlists, rate limiting, and strict JSON responses
- Scalability: Modular route files with centralized middleware enforcement

---

## 2. Route Mounting (app.ts)

### Base Configuration
- Server Port: `5000` (configurable via `PORT`)
- User API Base Path: `/api/v1`
- Admin API Base Path: `/api/v1/admin`
- Middleware: Helmet, CORS (credentials enabled), cookie parser, JSON body parsing

### Global Middleware Order
1. Global rate limiting
2. Database availability gate
3. Maintenance mode check
4. Route mounting

### Mounted Routes

#### User / Public APIs
- `/api/v1/catalog`
- `/api/v1/locations`
- `/api/v1/editorial`
- `/api/v1/import`
- `/api/v1/users`
- `/api/v1/ads`
- `/api/v1/otp`
- `/api/v1/ai`
- `/api/v1/messages`
- `/api/v1/chat`
- `/api/v1/notifications`
- `/api/v1/smart-alerts`
- `/api/v1/services`
- `/api/v1/businesses`
- `/api/v1/invoices`
- `/api/v1/payments`
- `/api/v1/plans`
- `/api/v1/contacts`

#### Admin APIs
- `/api/v1/admin` (login, logout, protected admin routes)
- `/api/v1/admin/messages`

#### Legacy / Deprecated
- `/api/locations` → deprecated
- `/api/v1/categories` → deprecated alias for catalog

---

## 3. Authentication & Authorization

### User Authentication
- OTP-based login
- JWT issued after verification
- Token accepted via Authorization header or HttpOnly cookie

### Admin Authentication
- Separate admin login
- `admin_token` HttpOnly cookie
- IP allowlist enforced via `ADMIN_ALLOWED_IPS`

### Authorization Helpers
- `protect`: Validates JWT
- `adminOnly`: Restricts to admin roles
- `restrictTo`: Role-based access (e.g., business)

---

## 4. User API Routes (`/api/v1`)

### 4.1 Ads (`/api/v1/ads`)
- `GET /` – Browse/search ads (public)
- `GET /public/home` – Homepage ads (public)
- `GET /my-ads` – User’s ads (protected)
- `GET /:id` – Get ad by ID (public)
- `POST /` – Create ad (protected)
- `PATCH /:id` – Update ad (protected)
- `PATCH /:id/promote` – Promote ad (protected)
- `PATCH /:id/sold` – Mark ad as sold (protected)
- `DELETE /:id` – Delete ad (protected)
- `POST /:id/restore` – Restore ad (admin only)

---

### 4.2 Chat (`/api/v1/chat`)
Handles conversation lifecycle and UX-level chat operations.

- `POST /start`
  - Start a new conversation
  - Auth: JWT
  - Middleware: conversationCreationLimiter

- `POST /messages`
  - Send message with optional image upload
  - Auth: JWT
  - Middleware: chatLimiter, multer

- `GET /messages/:conversationId`
  - Get messages for a conversation
  - Auth: JWT
  - Middleware: messagingReadLimiter

- `GET /inbox`
  - Get user’s conversation list
  - Auth: JWT
  - Middleware: messagingReadLimiter

---

### 4.3 Messages (`/api/v1/messages`)
Low-level message and conversation access.

- `GET /` – Get messages (protected)
- `GET /conversations` – Get conversations (protected)
- `POST /start` – Start conversation (protected)
- `POST /` – Send message (protected)
- `POST /:id` – Send message to conversation (protected)
- `GET /:id` – Get conversation messages (protected)
- `PATCH /:id/read` – Mark messages as read (protected)

> Note: `/chat` focuses on UX workflows, while `/messages` exposes core messaging primitives.

---

### 4.4 Notifications (`/api/v1/notifications`)
- `POST /register` – Register push notification token (protected)

---

### 4.5 Services (`/api/v1/services`)
Business-only service listings.

- `GET /:id` – Get service by ID (public)
- `POST /` – Create service (protected, business role)
- `GET /my-services` – Get user services (protected, business role)
- `PUT /:id` – Update service (protected, business role)
- `DELETE /:id` – Delete service (protected, business role)

---

### 4.6 Smart Alerts (`/api/v1/smart-alerts`)
- `GET /` – Get alerts (protected)
- `POST /` – Create alert (protected, smartAlertLimiter)
- `DELETE /:id` – Delete alert (protected)

---

### 4.7 Payments (`/api/v1/payments`)
- `GET /history` – Get payment history (protected)
- `POST /orders` – Create payment order (protected)
- `POST /webhook` – Payment webhook (HMAC verified, no auth)
- `GET /plans` – Get available plans (public)

---

### 4.8 Plans (`/api/v1/plans`)

#### Admin-only
- `POST /` – Create plan
- `PUT /:id` – Update plan
- `GET /` – Get all plans
- `PATCH /:id/toggle` – Toggle plan status

#### User / Public
- `GET /public` – Get public plans
- `GET /active` – Get active user plans
- `GET /permissions` – Get user permissions
- `POST /purchase` – Purchase plan (paymentRateLimiter)

---

### 4.9 Contact (`/api/v1/contacts`)
- `POST /` – Submit contact form (contactFormLimiter)

---

### 4.10 AI (`/api/v1/ai`)
- `POST /generate` – Generate AI content (protected, aiLimiter)

---

## 5. Admin API Routes (`/api/v1/admin`)

Admin APIs are protected by:
- IP allowlist
- `requireAdmin` middleware
- Admin-specific rate limiters

### Key Capabilities
- User management
- Business approval
- Ad moderation
- Payments & invoices
- System health & configuration
- Notifications & moderation

(Admin routes are documented separately in the Admin Dashboard documentation.)

---

## 6. Error Handling Standard

All API errors return JSON only.

```json
{
  "success": false,
  "error": "Error message",
  "path": "/api/v1/route",
  "status": 400
}
