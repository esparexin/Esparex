# Esparex v1.0.0 Beta Known Issues Ledger

**Release Candidate**: `v1.0.0-beta`  

---

## Active Non-Blocking Issues

| Issue ID | Module | Description | Severity | Workaround / Mitigation | Target Fix |
|:---:|---|---|:---:|---|:---:|
| **ISSUE-001** | `apps/mobile` | `react-native/no-inline-styles` ESLint baseline warnings | Low | Pure style cleanup tracked for Sprint 5 | `v1.0.0-rc1` |
| **ISSUE-002** | `@esparex/core` | Worker process force exit warning on Jest teardown | Low | Active open handle cleanup via `.unref()` | `v1.0.0-rc1` |
