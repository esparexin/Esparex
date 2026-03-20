# 04_ADMIN_SYSTEM_ARCHITECTURE — Operations & Moderation

## 🛡️ Admin Isolation
- **Separate App**: The `admin-frontend` is a standalone Next.js application, isolated from the user-facing codebase.
- **SSOT Components**: Frontend components in `frontend/src/components/admin/` are DEPRECATED. All active admin UI must reside in `admin-frontend/src/components/`.

---

## ⚖️ Moderation Engine
- **Gatekeeper Flow**: Every Ad, Business, and Service submission enters a `pending` state, requiring admin or system approval.
- **Audit Requirement**: All moderation actions (Approve, Reject, Suspend) must be logged with the Admin ID, Timestamp, and Reason.
- **Rejection Logic**: Rejections must use predefined, actionable reasons (e.g., "Blurry Photos", "Inaccurate Pricing") to guide the user toward a successful resubmission.

---

## 📊 Dashboard & Analytics
- **Real-Time Monitoring**: Analytics pipelines track active listings, user growth, and transaction volume.
- **Aggregation SSOT**: Dashboards must use canonical lifecycle enums. Legacy string filters are strictly prohibited in aggregation queries.
- **Performance**: High-volume admin queries should leverage MongoDB indexes (`2dsphere`, `status`, `userId`) and avoid deep lookups where possible.

---

## 🔐 Security & Access Control
- **Role-Based Access (RBAC)**: Support for multiple admin roles (SuperAdmin, Moderator, Analytics).
- **Session Governance**: Admin sessions are isolated and subject to higher security timeouts and MFA/OTP verification.
