# Esparex AI Agents Architecture

This directory (`.agents/`) contains the single source of truth for the AI Developer execution architecture. It follows the **Single Responsibility Principle** to keep the AI context lightweight, deterministic, and modular.

## Architecture Ownership Table

If you need to add or update knowledge, refer to this routing table:

| I want to add... | Target | Add it to... | Example |
| :--- | :--- | :--- | :--- |
| **I want to add a step to the process.** | `.agents/workflow/` | "Always run tests before PR." |
| **I want to add an absolute rule.** | `.agents/governance/` | "Never skip the linter." |
| **I want to change what context loads.** | `.agents/policy_engine/` | "UI tasks need accessibility rules." |
| **I want to add domain expertise.** | `.agents/skills/` | "How to write React components." |
| **I want to add a validation check.** | `.agents/rules/` | "All endpoints must return 200." |
| **I want to add a quality gate.** | `.agents/verification/` | "Checklist for PR readiness." |
| **I want to document WHY we built this.** | `.agents/decisions/` | "ADR-001: Policy Engine Design" |
| **Reusable document** | `templates/` | Standard format for incident reports. |

*Note: New Rules, Skills, and Verification modules must only be created if they are highly reusable and distinct.*
