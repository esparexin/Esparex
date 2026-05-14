# Frontend & Admin Standards

Status: Active  
Effective Date: 2026-05-14  
Owner: Frontend Lead

## 1. Component Architecture

- **Registry**: All components must live in `src/components`.
- **Naming**: Use `PascalCase` for component filenames (e.g., `StatusBanner.tsx`).
- **Enforcement**: `guard:naming`

## 2. Admin UI Status Governance

- **Hardcoded Strings**: The usage of raw status literals (e.g., `'approved'`, `'pending'`) in Admin components is forbidden.
- **Canonical Enums**: Use shared enums from `@shared/contracts` or approved mapping helpers.
- **Enforcement**: `guard:admin-status-literals`

## 3. Feedback and Notifications

- **No Sonner/Toast**: Do not use `sonner` or legacy `notify.*`.
- **Unified Feedback**: Use `FeedbackSystemContext` and the `feedback` event dispatcher.
- **Enforcement**: `guard:notification-governance`

## 4. API Boundary

- Components must stay presentation-focused.
- Data access must move into hooks or `lib/api` modules.
- Enforced by: `guard:component-api-boundary`
