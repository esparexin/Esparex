# Type Safety Escape Hatch Inventory

Automated repository inventory performed as Phase 0 of the Monorepo Permanent Type Safety Remediation Initiative.

## Summary

- Total `as any` instances identified: 519
- Total `as unknown as` instances identified: 7 (in documentation/scripts)
- Total `as never` instances identified: 17
- Total `@ts-ignore` / `@ts-expect-error` instances: 1 (in code comment)
- Total `eslint-disable` instances: 32

## Root Cause Classifications

1. **React UI Atom Prop Spreading**: Components in `@esparex/mobile-ui` and `@esparex/ui` spreading `props as any` onto native React Native components.
2. **Window & Global Object Property Augmentations**: Global browser/Node properties set via `(window as any)` or `(globalThis as any)` without TypeScript interface declarations.
3. **Mongoose Document & Query Typing**: Mongoose schema `pre('validate')` hooks lacking `this: Document` signatures, resulting in index signature casts.
4. **Lean Query & Aggregation Results**: Service methods casting `.lean()` query or aggregation pipeline outputs to `as any` instead of using typed DTO generics.
5. **Express & Test Context Mocking**: Controller middleware and unit test spec files using `as any` for request/response context objects.
