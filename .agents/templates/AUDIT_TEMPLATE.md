# [Feature / Module Name] Audit

**Scope:** [Describe exactly what is being audited — fields, flows, or components.]
**Audit Mode:** AUDIT ONLY. No implementation. No code changes.
**Governance:** All findings classified per `AI_WORKFLOW.md § Audit Governance Rules`.

---

## Audit Status

| Field | Value |
|-------|-------|
| **Status** | ⏳ In Review |
| **Version** | v1.0 |
| **Approved on** | *(ISO date — YYYY-MM-DD)* |
| **Approved by** | *(Product Owner / Engineering Lead)* |
| **Approval Reference** | *(GitHub Issue comment URL, PR review link, ADR number, or meeting minutes reference — a name alone is not sufficient)* |
| **Gate** | *(Any remaining pre-implementation conditions)* |

### Pre-Implementation Conditions (must be resolved before coding)

| Rule ID | Condition | Action Required |
|---------|-----------|----------------|
| *(BR-NNN)* | *(What must be verified or decided)* | *(Who decides and what action resolves it)* |

### Cleared for Implementation (Verified Issues — no further approval needed)

| Rule ID | Finding |
|---------|---------|
| *(BR-NNN)* | *(Short finding statement)* |

---

## 1. Scope

**In scope:**
- *(Layer 1, e.g. UI — React components, form validation)*
- *(Layer 2, e.g. API — request schema, route guards)*
- *(Layer 3, e.g. Backend — service, business logic)*

**Out of scope:**
- *(Explicitly list what is NOT being audited)*

---

## 2. Files Audited

| File | Role |
|------|------|
| `path/to/file` | What this file does in the audited flow |

---

## 3. Required vs Implemented

For each business rule in scope, compare requirement against live code.

| Rule ID | Requirement | Required | Implemented | Evidence |
|---------|------------|----------|-------------|---------|
| BR-NNN | Description | ✅ / ❌ | ✅ / ❌ MISSING | `file:line` |

---

## 4. Evidence

For each finding, quote the exact live code. No paraphrasing. Every block must include file path and line number.

### [Finding description]

```typescript
// file: apps/.../path/to/file.ts — L42–L55
[exact code block]
```

**Current behavior:** [What the code does]
**Expected behavior:** [What the approved business rule requires]

---

## 5. Verified Issues

Each entry must include:
- Statement of current behavior — evidence-based, no architecture opinions
- File and line reference
- Classification and severity

| # | Finding | Business Rule | Classification | Severity | File |
|---|---------|--------------|---------------|----------|------|
| 01 | [Finding] | **BR-NNN** | ✅ Verified Issue | Critical / High / Medium / Low | `file:line` |

---

## 6. Verified Observations

Factual descriptions of code structure that are not business rule violations but provide context for the findings.

| # | Observation | Classification | File |
|---|-------------|---------------|------|
| 01 | [Observation] | ✅ Verified Observation | `file` |

---

## 7. Business Rule Compliance

Verified against the approved business rule document.

| Rule ID | Business Rule | Status |
|---------|--------------|--------|
| BR-001 | [Rule] | ✅ Pass |
| BR-002 | [Rule] | ❌ Fail |
| BR-003 | [Rule] | ❓ Needs Catalog Verification |
| BR-004 | [Rule] | ⏳ Awaiting Business Approval |

**Pass: N / Total &nbsp;|&nbsp; Fail: N / Total &nbsp;|&nbsp; Needs Verification: N &nbsp;|&nbsp; Awaiting Approval: N**

| Implementation Health | Status |
|---|---|
| Overall Compliance (confirmed rules only) | **X%** |
| Critical Failures | N |
| High Failures | N |
| Medium Failures | N |
| Needs Catalog Verification | N |
| Awaiting Business Approval | N |

---

## 8. Audit Summary

### Required vs Implemented Matrix

| User Action / Trigger | Required Behavior | Missing | Status |
|---|---|---|---|
| [Trigger] | [What must happen] | [What is absent] | ✅ Correct / ✅ Verified Issue |

### All Findings

| # | Finding | Business Rule | Classification | Severity | File |
|---|---------|--------------|---------------|----------|------|
| 01 | [Finding] | **BR-NNN** | ✅ Verified Issue | High | `file:line` |

### What Is Correctly Implemented

| ✅ | Evidence |
|----|---------|
| [Correct behavior] | `file:line` |

---

## 9. No Proposed Features

Every finding in this document is a gap between the approved business rules and the existing implementation. No new features are proposed.

---

## Classification Reference

| Label | Meaning | Implementation Allowed Without Approval? |
|-------|---------|------------------------------------------|
| ✅ Verified Issue | Implementation contradicts an approved business rule. Evidence required. | Yes — implement immediately |
| ✅ Verified Observation | Factual code structure description. Not a failure. | N/A |
| 💡 Improvement Opportunity | Works correctly but could be improved. No business-behavior change. | No — requires approval |
| 🆕 Proposed Feature | Behavior does not exist today. Requires new logic, API, database, or UI. | No — requires approval + Proposed Feature document |
| ❓ Needs Verification | Insufficient evidence. No conclusion until resolved. | No — gather evidence first |
| ❓ Needs Catalog Verification | Rule depends on product catalog data not yet confirmed. | No — verify catalog, then reclassify |
| ⏳ Awaiting Business Approval | Rule is proposed but not formally approved. | No — obtain approval, then reclassify as ✅ or remove |
