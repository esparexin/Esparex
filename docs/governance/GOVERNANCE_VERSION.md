# Enterprise Governance Baseline
- **Version**: 1.0.0
- **Status**: Frozen
- **Effective Date**: 2026-07-07

Any future governance change requires:
- Architecture Decision Record (ADR)
- Governance version increment
- Changelog entry
- Review by repository maintainers

## Required GitHub Features
- Secret Scanning
- Push Protection
- Dependabot Security Updates
- OpenSSF Scorecard

## Required Workflows
- `ci.yml`
- `security.yml`
- `governance-health.yml`
- `actionlint.yml`
- `commitlint.yml`
- `pr-title.yml`
- `danger.yml`
- `scorecard.yml`
- `release-drafter.yml`
- `stale.yml`
- `labeler.yml`

## Change History
- **1.0.0** (2026-07-07): Initial enterprise governance baseline implemented.
