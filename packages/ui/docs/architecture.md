# Esparex UI Architecture

The `@esparex/ui` package acts as the single source of truth (SSOT) for all design system primitives and structural patterns across the Esparex Monorepo.

To prevent architectural drift and component duplication, the package is structured around strict ownership boundaries. Future contributors must adhere to this matrix when introducing new capabilities.

## Ownership Matrix

| Package/Directory | Owns                                            |
| ----------------- | ----------------------------------------------- |
| `tokens`          | Colors, spacing, typography, interaction, state |
| `atoms`           | Basic primitive building blocks (Buttons, Spinners) |
| `layout`          | Container, Grid, Stack, Section, PageLayout     |
| `navigation`      | Navigation model, Shells (Sidebar, HeaderShell) |
| `forms`           | Fields, controls, validation, RHF integration   |
| `feedback`        | Dialogs, sheets, toasts, alerts, popups         |
| `data-display`    | Tables, lists, cards, skeletons                 |

## Contribution Guidelines

1. **Do not duplicate primitives**: Before building a component, search the relevant folder to see if a primitive already exists.
2. **Follow Composition Models**: Use standard `Root`, `Trigger`, `Content` patterns (e.g. for feedback components) and `FieldRoot`, `FieldLabel`, etc. (for forms) rather than monolithic configuration objects.
3. **SSOT Imports**: Applications must consume these components from `@esparex/ui` and never re-implement them locally inside `apps/*/src/components`.
