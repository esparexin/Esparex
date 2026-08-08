# @esparex/design-tokens

The single source of truth for all design tokens across the Esparex platform.

## Install

This package is a workspace dependency. Add it to any app via `package.json`:

```json
"dependencies": {
  "@esparex/design-tokens": "*"
}
```

Add the path alias to `tsconfig.json`:

```json
"paths": {
  "@esparex/design-tokens": ["../../packages/design-tokens/src"],
  "@esparex/design-tokens/*": ["../../packages/design-tokens/src/*"]
}
```

## Usage

### React Native (StyleSheet)

```tsx
import { semantic } from '@esparex/design-tokens';

const styles = StyleSheet.create({
  container: { backgroundColor: semantic.light.background },
  text:      { color: semantic.light.foreground },
  card:      { backgroundColor: semantic.light.card },
  border:    { borderColor: semantic.light.border },
});
```

### Web (Tailwind / CSS variables)

Tokens are mapped to CSS custom properties in `apps/web/src/app/globals.css`.
Use Tailwind utilities: `bg-background`, `text-foreground`, `border-border`, etc.

## Token Layers

```
base.*          → Primitive palette. Never use directly in app code.
semantic.light  → Light mode intent tokens. Use these in components.
semantic.dark   → Dark mode intent tokens.
```

## Full Catalog

See [`docs/design-system/token-catalog.md`](../../docs/design-system/token-catalog.md) for the complete reference including all token values, usage guidelines, platform support, and provenance.

## API Freeze

The public API (`semantic.light.*`, `semantic.dark.*`) is frozen at Sprint 2.
Any additions or changes require an Architecture Decision Record (ADR).

Open ADR: `base.action` (`#2563eb`) — pending semantic promotion decision.
See [`docs/tracking/token-exceptions.md`](../../docs/tracking/token-exceptions.md).
