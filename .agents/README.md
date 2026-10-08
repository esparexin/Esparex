# Esparex AI Agents Architecture

This directory (`.agents/`) holds the AI Developer execution architecture, operating
under the supreme authority of `AGENTS.md` (the single authoritative source of truth
for architectural governance). It follows the **Single Responsibility Principle** to keep the AI context lightweight, deterministic, and modular.

## Architecture Ownership Table

If you need to add or update knowledge, refer to this routing table:

| I want to add... | Target | Add it to... | Example |
| :--- | :--- | :--- | :--- |
| **I want to add a step to the process.** | `.agents/workflow/` | "Always run tests before PR." |
| **I want to add an absolute policy/rule.** | `AGENTS.md` | "Never skip the linter." |
| **I want to change what context loads.** | `.agents/policy_engine/` | "UI tasks need accessibility rules." |
| **I want to add domain expertise.** | `.agents/skills/` | "How to write React components." |
| **I want to add an automated guard/check.** | `scripts/` (enforced in `repo:gate`) | "All endpoints must return canonical envelope." |
| **I want to add a PR quality gate.** | `.github/PULL_REQUEST_TEMPLATE.md` | "Checklist for PR readiness." |
| **I want to document WHY we built this.** | `.agents/decisions/` | "ADR-001: Policy Engine Design" |
| **Reusable document template** | `.agents/templates/` | Standard format for audit reports. |

*Note: New Skills, Templates, and Decisions must only be created if they are highly reusable and distinct.*
