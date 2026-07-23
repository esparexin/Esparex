# Esparex Repository Audit Report

**Generated At:** 2026-07-23T10:45:06.247Z  
**Governance Status:** PASS

---

## 1. Executive Summary

| Metric | Count / Status | Notes |
|---|---:|---|
| **Governance Status** | **PASS** | Passed core architecture & SSOT guards |
| **Total Monorepo Directories** | 646 | Workspace directory count |
| **Transitional Modules** | 164 | In `core/src/services` |
| — *Pure Re-export Shims* | 83 | Forwarders to `core/src/domains` |
| — *Facades & Wrappers* | 2 | Compatibility wrappers |
| — *Unmigrated Services* | 79 | Pending DDD domain encapsulation |
| **Empty Directories** | 2 | E.g. `docs/audits/P2.2` |
| **Orphaned Directories** | 0 | `tools/templates/domain-package` |
| **JSCPD Code Clones** | 11 | Detected code duplications |
| **Boundary Violations** | 0 | Package boundary guards |
| **SSOT Violations** | 0 | SSOT schema & contract guards |
| **Circular Violations** | 0 | Circular dependency guards |

---

## 2. Empty & Orphaned Directories

### Empty Directories
- `apps/mobile/android/capacitor-cordova-android-plugins/.gradle/9.2.0/expanded`
- `apps/mobile/android/capacitor-cordova-android-plugins/.gradle/9.2.0/vcsMetadata`

### Orphaned Directories
*None*

---

## 3. Structural Duplications (JSCPD Summary)

Total Clones: **11**

### Clone #1 (9 lines, 0 tokens)
- **Source A:** `[object Object]` (Lundefined-Lundefined)
- **Source B:** `[object Object]` (Lundefined-Lundefined)

### Clone #2 (9 lines, 0 tokens)
- **Source A:** `[object Object]` (Lundefined-Lundefined)
- **Source B:** `[object Object]` (Lundefined-Lundefined)

### Clone #3 (9 lines, 0 tokens)
- **Source A:** `[object Object]` (Lundefined-Lundefined)
- **Source B:** `[object Object]` (Lundefined-Lundefined)

### Clone #4 (16 lines, 0 tokens)
- **Source A:** `[object Object]` (Lundefined-Lundefined)
- **Source B:** `[object Object]` (Lundefined-Lundefined)

### Clone #5 (12 lines, 0 tokens)
- **Source A:** `[object Object]` (Lundefined-Lundefined)
- **Source B:** `[object Object]` (Lundefined-Lundefined)

### Clone #6 (45 lines, 0 tokens)
- **Source A:** `[object Object]` (Lundefined-Lundefined)
- **Source B:** `[object Object]` (Lundefined-Lundefined)

### Clone #7 (37 lines, 0 tokens)
- **Source A:** `[object Object]` (Lundefined-Lundefined)
- **Source B:** `[object Object]` (Lundefined-Lundefined)

### Clone #8 (15 lines, 0 tokens)
- **Source A:** `[object Object]` (Lundefined-Lundefined)
- **Source B:** `[object Object]` (Lundefined-Lundefined)

### Clone #9 (14 lines, 0 tokens)
- **Source A:** `[object Object]` (Lundefined-Lundefined)
- **Source B:** `[object Object]` (Lundefined-Lundefined)

### Clone #10 (16 lines, 0 tokens)
- **Source A:** `[object Object]` (Lundefined-Lundefined)
- **Source B:** `[object Object]` (Lundefined-Lundefined)


---

## 4. Operational Governance Recommendations

1. **PR 1 (Auditor Baseline):** Establish canonical audit reporting pipeline.
2. **PR 2 (Zero Risk Cleanup):** Delete verified empty directories (`docs/audits/`), obsolete bash scripts, and orphaned templates (`tools/templates/`).
3. **PR 3 (Ownership Registry):** Document canonical package & module boundaries.
4. **PR 4 (Boundary Enforcement):** Enforce strict dependency cruiser & ESLint boundaries.
5. **PR 5 (CI Enforcement):** Wire `repository-auditor.js` into `npm run repo:gate`.
6. **PR 6+ (Bounded Context Migrations):** Migrate services domain-by-domain (Notifications $\rightarrow$ Payments $\rightarrow$ Catalog $\rightarrow$ Identity $\rightarrow$ Listings).
