# AI Governance Bridge

Status: Active  
Effective Date: 2026-05-14  
Owner: AI Governance Engineer

## 1. Authority

This document serves as the high-level bridge between the Platform Architecture and the AI-specific governance stored in `/ai-governance/`.

Authoritative AI Documents:
- [AI Governance SSOT](../ai-governance/SSOT.md)
- [AI Change SOP](../ai-governance/SOP.md)
- [AI Context (Machine Readable)](../ai-governance/AI_CONTEXT.json)

## 2. Core Constraints for AI Agents

1. **Registry First**: Never create new documentation unless a registry entry exists in `docs/00-index.md`.
2. **Update-In-Place**: Always update existing canonical documents. Never create `_final` or `_v2` copies.
3. **Archive Procedure**: Move superseded documents to `archive/legacy/YYYY-MM/` immediately.
4. **Tool Wrappers**: Local tool files (e.g., `.cursorrules`) are minimal pointers only. They must not define independent logic.

## 3. Runtime AI SSOT

- **Provider**: OpenAI is the primary production provider.
- **Model**: `gpt-4o`.
- **Gemini Fallback**: Active via `GEMINI_API_KEY` for moderation tasks.
