# 06_DATA_LIFECYCLE_RULES — State Machine Specification

## 🛒 Ad Lifecycle (`AD_STATUS`)
1.  **DRAFT**: Initial state, visible only to owner.
2.  **PENDING**: Submitted for review, hidden from search.
3.  **LIVE**: Approved by admin, visible to all.
4.  **REJECTED**: Failed moderation, requires user fix.
5.  **EXPIRED**: Validity window (30 days) closed.
6.  **SOLD**: Item successfully transacted.
7.  **DELETED**: Soft-deleted by user or admin.

---

## 🏢 Business Lifecycle (`BUSINESS_STATUS`)
1.  **PENDING**: Awaiting document verification.
2.  **LIVE**: Verified and active business profile.
3.  **SUSPENDED**: Temporarily locked due to policy violation.
4.  **DELETED**: Profile decommissioned.

---

## ⚙️ Cron & Automation Behavior
- **Daily Expiry Check**: A system cron task runs at 00:00 UTC+5:30 to transition `live` ads to `expired` if their validity window has closed.
- **Renewal Logic**: Expired ads can be renewed, which resets the validity start date to the current timestamp and moves them to `pending` or `live` (status-governed).
- **Slot Mechanics**: Business slots are released immediately upon an ad moving to `deleted` or `sold`.

---

## ⚖️ State Transition Governance
- **Unidirectional Locks**: Certain transitions (e.g., `sold` → `live`) are blocked by the `LifecycleGuard`.
- **Admin Overrides**: Administrators have the capability to force-transition records for support purposes, subject to audit logging.
