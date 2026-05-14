# 🛡️ Esparex Fraud Guardrails & Listing Invariants

This document defines the authoritative security boundaries and architectural invariants for the Esparex listing infrastructure. These guards are non-negotiable and must be maintained across all future refactors.

---

## 🧠 Core Philosophy: "Authoritative Enforcement"
Security in Esparex is layered. We do not trust the client, and we do not trust the request context in isolation. Every listing attempt is validated by the **AdOrchestrator**, which acts as the final gatekeeper before data hits the Single Source of Truth (SSOT).

---

## 🛡️ 1. Fraud Detection Layers

### Layer A: Middleware Analysis
The `FraudMiddleware` performs lightweight, pre-execution scoring based on:
- **Actor Reputation:** Age of account, verification status.
- **Velocity:** Request rates and IP patterns.
- **Risk State:** Detection of suspicious behavior patterns.

**Invariant:** If the middleware detects high risk, it injects a `riskState: 'SAFE_MODE'` into the request context.

### Layer B: Orchestrator Authoritative Check
The `AdOrchestrator` performs a mandatory verification of the risk state before finalizing the listing status.

**Invariant:** 
- If `riskState === 'SAFE_MODE'`, the listing **MUST** be set to `moderationStatus: 'held_for_review'`, regardless of any other input.
- A high `fraudScore` results in the listing being blocked or held, even if the user is verified.

---

## 🚦 2. Admin Trust & Privilege Boundaries

### The `assertAdmin` Guard
Administrative privileges are never granted based on the request's `actor` claim alone.

**Invariant:** 
If a request claims to be an `ADMIN`, the `AdOrchestrator` **MUST** verify the `authUserId` against the database to confirm they hold the `admin` role.

### Direct Approval (Live-at-Creation)
Only verified administrators can bypass the `PENDING` state to create a `LIVE` listing immediately.

**Invariant:** 
- Admin-created listings are set to `moderationStatus: 'auto_approved'`.
- Non-admin listings **always** start in `PENDING` status or are `held_for_review`.

---

## 🔄 3. Lifecycle State Machine

The status of a listing is governed by a strict state machine enforced in the `AdOrchestrator` and `StatusMutationService`.

### Invariants:
1. **SSOT Integrity:** The `status` and `moderationStatus` fields must always be in sync. A `LIVE` listing must have an `auto_approved` or `manual_approved` moderation status.
2. **Approval Path:** A transition to `LIVE` status (via `mutateStatus`) is strictly forbidden unless the metadata contains `action: 'moderation_approve'`.
3. **Audit Trail:** Every status change must be recorded in the `timeline` array with a reason and actor ID.

---

## 📊 4. Atomic View Aggregation

To prevent data loss and ensure consistent performance, views are buffered in Redis before being flushed to MongoDB.

### Invariants:
1. **Zero Data Loss:** If a MongoDB flush fails (e.g., database timeout), the buffered count **MUST** be restored to Redis to prevent loss of view counts.
2. **Atomic Increment:** View counts in MongoDB are updated using atomic `$inc` operations to prevent race conditions.

---

## 🛑 5. Maintenance Mode

The `AdOrchestrator` respects the global maintenance flag.

**Invariant:** 
When `maintenanceMode` is `ON`, all listing mutations (create/update/status change) are blocked to preserve data integrity during migrations.
