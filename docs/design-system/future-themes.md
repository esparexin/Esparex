# Future Themes

**Owner:** Platform  
**Last Updated:** 2026-07-06

---

## Purpose

This document tracks planned themes for future Esparex products. Theme folders are **not** created until a project actively begins development.

Creating empty placeholder folders tends to accumulate stale scaffolding. Theme creation is a deliberate step that signals a product has started.

---

## How to Create a New Theme

1. Follow the [Theme Contract](./standards/THEME_CONTRACT.md)
2. Copy `packages/ui/src/themes/default/index.css` as your starting point
3. Create `packages/ui/src/themes/<product>/index.css`
4. Override tokens with brand-specific values
5. Add export entry to `packages/ui/package.json`
6. Update the table below with the theme's status

---

## Planned Themes

| Product | Theme Name | Status | Notes |
|---|---|---|---|
| Farmer Marketplace | `farmer` | Planned | Earthy greens, warm ambers. To be created when project starts. |
| CRM Platform | `crm` | Planned | Professional blues, clean neutrals. To be created when project starts. |
| Portfolio Site | `portfolio` | Planned | Minimal, monochrome. To be created when project starts. |

---

## Active Themes

| Theme | Package Export | Status |
|---|---|---|
| MAD Entertrainment | `@mad/ui/themes/mad` | Stable |
| Default (neutral) | `@mad/ui/themes/default` | Stable |
