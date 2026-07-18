# Contracts Migration Audit

**Domain / Module**: Shared Contracts (`packages/contracts`)
**Date**: 2026-07-18

## 1. Current State
Currently, cross-domain contracts, data transfer objects (DTOs), API interfaces, and schemas are scattered across multiple directories:
- `shared/src/contracts/` (API responses, chat contracts)
- `shared/src/schemas/` (Zod schemas for payloads)
- `shared/src/types/` (TypeScript interfaces for API shapes)
- `shared/src/enums/` (Shared enums)
- `core/src/types/` (Domain-specific types leaking into core)

## 2. Issues & Violations
- **Scattered Truth**: No single boundary for external contracts.
- **Leakage**: Internal domain concepts are occasionally mixed with external DTOs.
- **Improper Boundary**: The `shared` workspace package currently acts as a catch-all, violating the explicit `packages/contracts` boundary defined in Architecture v1.0.

## 3. Scope of Migration
Move all DTOs, schemas, and shared enums to `packages/contracts/src/`. This provides a stable, zero-business-logic boundary for all subsequent domain migrations to depend upon.
