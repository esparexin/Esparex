# Sprint 4 Retrospective

## What Went Well (Keep Doing)

1. **Measurable Exit Criteria**: Structuring Sprint 4 with explicit quantitative targets (0 TypeScript errors, 0 WCAG critical issues, 0 duplicate primitives, 100% design system compliance) ensured objective completion gates.
2. **Automated CI Parity**: Integrating `npx expo export` for both iOS and Android into `.github/workflows/ci.yml` guarantees remote CI runs the exact same bundle compilation pipeline as local development.
3. **Accessibility First Engineering**: Baking `accessibilityRole`, `accessibilityLabel`, and automated `hitSlop` into shared primitives (`AppButton`, `AppInput`) resolved accessibility gaps systematically across 70+ mobile touchables and form controls.
4. **Strict Component Ownership**: Validating that all web UI primitives in `apps/web/src/components/ui` act as 1-line re-exports of `@esparex/ui` preserved zero-duplication architecture.

---

## Key Lessons Learned

- **Lesson**: High-density feeds (like marketplace listings and search results) benefit significantly from quantitative performance baselines (LCP, CLS, INP) captured early in the sprint.
- **Lesson**: Automated `hitSlop` calculation on small button variants guarantees minimum 44dp touch targets across all screen sizes without requiring manual per-button styling.
