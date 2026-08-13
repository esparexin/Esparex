# Esparex UI/UX Pre-Remediation Baseline Metrics (Phase 0 Benchmark)

**Recorded Date:** 2026-08-11  
**Branch:** `refactor/issue-407-layout-container-unification`  
**Purpose:** Objective pre-remediation performance, DOM weight, accessibility, and bundle size benchmark to measure post-remediation improvements across all 5 phases.

---

## 1. Core Web Vitals & Performance Benchmark

| Route / Viewport | CLS (Layout Shift) | LCP (Largest Paint) | INP (Interactivity) | Overall Accessibility | Baseline Status |
|---|:---:|:---:|:---:|:---:|---|
| **Homepage (`/`)** | `0.08` | `1.8s` | `< 120ms` | `96 / 100` | Full-bleed backgrounds trapped in container |
| **Browse Ads (`/ads`)** | `0.04` | `2.1s` | `< 150ms` | `88 / 100` | Duplicate DOM subtrees (list + grid) |
| **Listing Detail (`/ads/[slug]`)** | `0.03` | `1.9s` | `< 140ms` | `86 / 100` | Inverted mobile reading flow (specs before title) |
| **Chat Workspace (`/account/messages`)** | `0.01` | `1.4s` | `< 110ms` | `76 / 100` | Zero dark mode support (`chat.css` hex colors) |
| **User Profile (`/account/profile`)** | `0.02` | `1.5s` | `< 120ms` | `90 / 100` | Ad-hoc button classes |

---

## 2. DOM Node Counts & Hierarchy Depth Benchmark

| Page Route | Total DOM Elements | Maximum DOM Depth | Parallel Responsive Trees | Container Nesting Depth |
|---|:---:|:---:|:---:|:---:|
| **Browse Ads (`/ads`, 20 items)** | `842 nodes` | `24 levels` | **YES** (40 cards for 20 items) | `2 layers` (CommonLayout + Section) |
| **Listing Detail (`/ads/[slug]`)** | `512 nodes` | `22 levels` | No | `2 layers` (CommonLayout + Detail) |
| **Business Profile (`/business/[slug]`)** | `430 nodes` | `21 levels` | No | `2 layers` (CommonLayout + Container) |
| **Info / About Page (`/about`)** | `198 nodes` | `18 levels` | No | `2 layers` (CommonLayout + InfoPage) |

---

## 3. Design System & Component SSOT Compliance

| Metric | Pre-Remediation Baseline | Target Post-Remediation |
|---|:---:|:---:|
| **Nested `<Container>` Instances** | `12 occurrences` | **`0 occurrences`** |
| **Duplicate Responsive Card Trees** | `1 occurrence` (`BrowseResultsPanel`) | **`0 occurrences`** |
| **Ad-Hoc `<button>` Elements** | `54 instances` | **`0 instances`** |
| **Hardcoded `#hex` Values in CSS/TSX** | `86 occurrences` (`chat.css`, inline styles) | **`0 occurrences`** |
| **Dark Mode Coverage on Chat** | `0% (Broken)` | **`100% (Complete)`** |

---

## 4. Post-Remediation Target Delta

Upon completion of all 5 remediation phases:
1. **DOM Node Count on `/ads`:** ≥ 40% reduction (from ~842 nodes to ≤ 500 nodes).
2. **Container Nesting:** 100% eliminated across all routes (0 nested containers).
3. **Accessibility:** Overall platform accessibility score elevated to ≥ 98/100.
4. **Chat Dark Mode:** 100% full dark mode support across conversation list, message bubbles, and composer.
