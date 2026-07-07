# ADR 003: Deployment Governance

## Status
Accepted

## Context
Deploying directly via un-gated CI actions can lead to drift and architectural violation in production.

## Decision
All deployments are gated by `deploy:gate`, an internal script that validates environments, API parity, and metadata before releasing. CI must invoke this script.

## Consequences
- Deployment logic stays internal and testable locally.
- Reduces dependency on GitHub Action runner environments.
