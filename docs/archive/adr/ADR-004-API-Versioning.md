# ADR 004: API Versioning

## Status
Accepted

## Context
Breaking changes to API structures impact clients heavily.

## Decision
All APIs will be namespaced by version (e.g., `/api/v1/`). When breaking changes are required, a new version must be exposed and the old version deprecated on a timeline.

## Consequences
- Requires strict route validation.
- Protects clients from sudden breakage.
