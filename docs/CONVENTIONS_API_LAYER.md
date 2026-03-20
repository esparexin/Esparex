# Esparex Platform — API Layer Conventions

## 1. API Calls
- All API calls must go through designated API/service layer.
- No direct `fetch()` in React components.
- SSR exceptions must be documented.

## 2. Business Logic
- Business logic must reside in services, not controllers or components.

## 3. Documentation
- Document API contract and exceptions in `docs/05_API_CONTRACTS.md`.

---
_Last updated: March 15, 2026_