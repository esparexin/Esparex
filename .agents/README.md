# Esparex AI Agents Architecture

This directory (`.agents/`) contains the single source of truth for the AI Developer execution architecture. It follows the **Single Responsibility Principle** to keep the AI context lightweight, deterministic, and modular.

## Architecture Ownership Table

If you need to add or update knowledge, refer to this routing table:

| I want to add... | Where does it go? | Example |
| :--- | :--- | :--- |
| **New execution step** | `workflow/` | Adding a new phase before code generation. |
| **New engineering policy** | `governance/` | "Never allow nested ternary operators." |
| **Esparex business behavior** | `project/` | Defining what a "SuperAdmin" is in the system. |
| **Validation checklist** | `rules/` | "Checklist for WCAG 2.1 Accessibility." |
| **Technical expertise** | `skills/` | "How to build a highly concurrent rate limiter in Redis." |
| **Quality gate** | `verification/` | "Steps to run the e2e Playwright suite." |
| **Reusable document** | `templates/` | Standard format for incident reports. |

*Note: New Rules, Skills, and Verification modules must only be created if they are highly reusable and distinct.*
