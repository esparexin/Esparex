# ADR 005: Governance Workflows

## Status
Accepted

## Context
Automated governance is necessary to enforce repository rules without relying purely on human review. 

## Decision
We enforce governance via a split architecture: 
1. **Local Authoritative**: Internal scripts (`npm run governance:all`) ensure architecture and contracts remain stable locally and in CI.
2. **GitHub Native Augmentation**: CI workflows (`security.yml`, `scorecard.yml`, `danger.yml`, `actionlint.yml`) augment local scripts by adding supply chain security, conventional commits, and automated PR rules.

## Consequences
- Requires dual maintenance, but keeps the local dev environment as authoritative as possible.
