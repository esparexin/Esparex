# Pending Roadmap (Post v1.0)

The following work items are **future enhancements** and are **not required** for Governance Engine v1.0. They extend the platform with additional capabilities but do not affect the correctness, determinism, or production readiness of the current governance system.

---

## PR7B — Performance Optimization

**Objective**

Improve governance scan performance without changing rule behavior or execution results.

### Scope

- Introduce shared AST parser cache (if profiling justifies it)
- Reduce duplicate AST parsing across UI validators
- Benchmark validator execution times
- Measure memory usage
- Optimize filesystem access where beneficial
- Preserve deterministic execution

### Deliverables

- Performance benchmark report
- Before/after comparison
- Verification that scan results remain identical
- Zero Git noise verification

---

## PR8 — Additional Security, Performance & Architecture Validators

**Objective**

Implement validators for the currently documented but intentionally inactive governance rules.

### Scope

Security
- Secure Upload Handling
- RBAC Authorization Validation

Performance
- Optimized Font Loading
- Render-Blocking Resource Detection

Architecture
- Observability Isolation
- DTO Governance
- App Router Layout Safety
- Validation Drift Prevention

### Deliverables

- New validator implementations
- Unit tests
- Documentation updates
- Registry mapping updates

---

## PR9 — Governance Auto-Fix Framework

**Objective**

Introduce safe automatic remediation for supported governance findings.

### Scope

- Auto-fix engine
- Dry-run mode
- Preview changes
- Rollback support
- Safe-fix eligibility metadata
- Fix reporting

### Deliverables

- Auto-fix framework
- Supported fix catalog
- Verification tests
- Rollback validation

---

## PR10 — Governance Reporting Dashboard

**Objective**

Provide comprehensive reporting and visualization of governance results.

### Scope

- HTML reports
- Markdown reports
- JSON reports
- Rule summaries
- Category summaries
- Severity summaries
- Validator metrics
- Historical trends

### Deliverables

- Reporting engine
- Dashboard documentation
- Export formats
- Trend reports

---

## PR11 — Governance Plugin SDK

**Objective**

Allow external validators and governance extensions without modifying the core engine.

### Scope

- Plugin API
- Plugin lifecycle
- Validator extension points
- Version compatibility
- Plugin discovery
- Plugin documentation

### Deliverables

- Plugin SDK
- Example plugins
- SDK documentation
- Compatibility tests

---

## PR12 — Advanced CI/CD Integration

**Objective**

Deeply integrate governance into continuous integration and deployment pipelines.

### Scope

- GitHub Actions enhancements
- Pull request annotations
- SARIF export
- Incremental repository scanning
- Build gate policies
- CI quality metrics

### Deliverables

- CI workflows
- SARIF output
- PR annotations
- Integration documentation
- End-to-end verification

---

# Status

| PR | Title | Priority | Status |
|----|-------|----------|--------|
| PR7B | Performance Optimization | Medium | Pending |
| PR8 | Additional Security / Performance / Architecture Validators | High | Pending |
| PR9 | Governance Auto-Fix Framework | Medium | Pending |
| PR10 | Governance Reporting Dashboard | Medium | Pending |
| PR11 | Governance Plugin SDK | Low | Pending |
| PR12 | Advanced CI/CD Integration | High | Pending |

## Notes

These roadmap items are **Version 2.0 enhancements**.

The Governance Engine **v1.0** is considered complete after the successful completion of:

- ✅ PR1 — Lifecycle Stabilization
- ✅ PR2 — Finding Persistence Stabilization
- ✅ PR3 — Repository Baseline & Policy
- ✅ PR4 — Rule Metadata & Registry
- ✅ PR5 — Rule Documentation & Knowledge Base
- ✅ PR6 — Rule Execution Engine
- ✅ PR7A — Governance Rule Quality

Future PRs extend the platform but are **not prerequisites for production use** of the current governance system.
