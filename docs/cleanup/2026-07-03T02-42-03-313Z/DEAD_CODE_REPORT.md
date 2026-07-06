# Dead Code Verification Report

This report details reference matches and classifications for all scanned candidates.

---

### 1. [VERIFIED_SAFE_DELETE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/admin/next-env.d.ts
- **Confidence Score:** 100%
- **Risk Score:** NONE
- **Evidence:** No active imports, runtime references, configurations, or doc matches found.
- **Recommendation:** Safe to delete. Recommended for cleanup. Update documentation links if desired.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 100
- Replacement checks: 100
- **Overall Confidence**: 100%

### 2. [BLOCK_DELETE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/admin/src/app/not-found.tsx
- **Confidence Score:** 100%
- **Risk Score:** CRITICAL
- **Evidence:** File base name matches Next.js app router convention: 'not-found.tsx'
- **Recommendation:** DO NOT DELETE. Structural config, authentication code, or framework layout file required by build engine.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 0
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 80
- Replacement checks: 50
- **Overall Confidence**: 80%

### 3. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/admin/src/hooks/useAdminStatusFilteredList.ts
- **Confidence Score:** 94%
- **Risk Score:** MEDIUM
- **Evidence:** Unreferenced candidate requiring verification.
- **Recommendation:** Manually audit and trace file references.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 80
- Replacement checks: 50
- **Overall Confidence**: 94%

### 4. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/admin/src/proxy.ts
- **Confidence Score:** 81%
- **Risk Score:** HIGH
- **Evidence:** Package Export found in 'package.json'
- **Recommendation:** Verify if build setups or packages exports are active before purging.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 10
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 80
- Replacement checks: 50
- **Overall Confidence**: 81%

