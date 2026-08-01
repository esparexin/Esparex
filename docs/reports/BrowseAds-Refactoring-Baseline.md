# BrowseAds Architecture Refactoring Baseline & Audit Report

**Date:** 2026-08-01  
**Branch:** `refactor/browseads-ssot-alignment`  
**Scope:** `BrowseAds.tsx`, `BrowseListingsView.tsx`, `useBrowseListingsController.ts`, `browseFilterBuilders.ts`, `BrowseResultsPanel.tsx`, `AdCardGrid.tsx`, `AdCardList.tsx`.

---

## 1. Current Architecture Inventory

| Layer / Component | Responsibility | Current Implementation | Refactoring Objective |
| :--- | :--- | :--- | :--- |
| **Presentation Entry** | `BrowseAds.tsx` | View wrapper passing configuration, card rendering, and filter builder props to `BrowseListingsView`. | Decompose and streamline configuration. |
| **Layout Shell** | `BrowseListingsView.tsx` | Layout container wiring sidebar, header controls, and results panel. | Pure presentation component. |
| **Data & State Controller** | `useBrowseListingsController.ts` | Handles search query debouncing, URL sync, pagination state, and React Query data fetching. | Extract dedicated data fetching / API orchestration layer. |
| **Filter Pipeline** | `browseFilterBuilders.ts` | Builds base browse filters, applies location & radius filters. | Centralize query transformation & sort mapping. |
| **Results Display** | `BrowseResultsPanel.tsx` | Displays results grid, list, virtualized view, empty states, and error handling. | Optimize rendering, memoization, and layout props. |
| **Card Primitives** | `AdCardGrid.tsx` / `AdCardList.tsx` | Renders individual ad cards for grid and list view modes. | Ensure strict SSOT presentation without logic duplication. |

---

## 2. Identified Refactoring Pipeline (8-Commit Execution Strategy)

1. **Commit 1:** `chore(browse): audit BrowseAds architecture and establish refactoring baseline` (Baseline Documented)
2. **Commit 2:** `refactor(browse): extract data loading and API orchestration` (Extract Data Layer & Controller)
3. **Commit 3:** `refactor(filters): centralize browse filter pipeline and query mapping` (Centralize Filter Pipeline)
4. **Commit 4:** `refactor(ui): decompose BrowseAds into reusable presentation components` (Modularize UI Components)
5. **Commit 5:** `perf(browse): optimize rendering and eliminate unnecessary re-renders` (Memoization & Performance)
6. **Commit 6:** `cleanup(browse): remove legacy code, dead paths and obsolete utilities` (Clean Up Obsolete Code)
7. **Commit 7:** `test(browse): strengthen BrowseAds integration and regression coverage` (Add/Update Tests)
8. **Commit 8:** `docs(browse): document architecture decisions and verification results` (Final ADR & Verification Report)

---

## 3. Verification Baseline
- `npm run type-check`: Passed (0 errors)
- `npm run repo:gate`: Passed (100% Score)
