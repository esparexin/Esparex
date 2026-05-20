# Documentation Archive Policy

Status: Active  
Effective Date: 2026-05-14  
Owner: Chief Documentation Governance Engineer

## 1. Purpose

To prevent documentation rot, duplication, and "final/latest" filename proliferation by defining a strict lifecycle for non-canonical documents.

## 2. Archive Criteria

A document MUST be moved to `archive/legacy/` if:
- It is a one-time audit report older than 30 days.
- It has been superseded by a canonical SSOT in `docs/`.
- It describes a feature or architecture that has been fully decommissioned.
- It was created for a specific migration that has completed.

## 3. Naming Conventions

- Archived files MUST retain their original filenames to preserve searchability.
- Files should be grouped by year-month: `archive/legacy/YYYY-MM/`.
- Do NOT append "old" or "superseded" to the filename itself.

## 4. Update-In-Place Rule

- **Canonical Documents** (00-09 in `docs/`) MUST be updated in place.
- Do NOT create `01-business-blueprint-v2.md`. Edit `01-business-blueprint.md`.
- Historical context should be maintained via Git history, not via file duplication.

## 5. Retention Rules

- `archive/legacy/`: Retained indefinitely unless explicitly purged during an Enterprise Cleanup.
- `archive/superseded/`: For documents replaced by a significantly different version where the transition history is critical.

## 6. Restore Procedure

To restore an archived document:
1. Copy the file from `archive/legacy/` to `docs/`.
2. Register the restored file in `docs/00-index.md`.
3. If it supersedes an existing doc, follow the Archive Procedure for the old one.
