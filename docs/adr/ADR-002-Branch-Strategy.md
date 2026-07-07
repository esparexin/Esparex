# ADR 002: Branch Strategy

## Status
Accepted

## Context
Clear release and integration rules are needed for a scaling engineering team.

## Decision
GitFlow-lite: `main` is production, `develop` is integration, and `feature/*` branches are used for work.

## Consequences
- Protects production from untested code.
- Encourages short-lived feature branches.
