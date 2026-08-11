# UI Architecture Guards

## Purpose

`guard-ui-architecture.js` is a static analysis guard that enforces the
[Single-Instance Responsive Architecture governance rules](./ESPAREX_UI_UX_DESIGN_STANDARDS.md)
across all TSX/JSX files in `apps/web/src`.

It runs as part of the CI `governance:guards` chain and can be executed locally
before any commit.

---

## Running the Guard

```bash
# Full scan (default — apps/web/src)
npm run guard:ui-architecture

# Scope to a specific directory
node scripts/guard-ui-architecture.js --path apps/web/src/components/user

# Treat all errors as warnings (never fails CI — for local exploration)
node scripts/guard-ui-architecture.js --warn-only
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0`  | Passed — 0 errors (warnings are non-blocking) |
| `1`  | Failed — at least 1 error-severity violation |

---

## Rules Reference

### Errors (block CI, `exit 1`)

| Rule ID | Description |
|---------|-------------|
| `nested-container` | More than one non-annotated `<Container>` or `<PageContainer>` in the same file. Indicates potential layout nesting. |
| `multiple-h1` | More than one non-annotated `<h1>` element in the same file. Violates heading hierarchy governance. |
| `parallel-responsive-dom` | Both `lg:hidden` and `hidden lg:*` class patterns present in the same file. Indicates duplicate parallel DOM subtrees. |
| `hardcoded-hex-color` | A hardcoded CSS hex color (`#XXXXXX`) in a TSX file. Use design tokens (`var(--color-*)`) or semantic CSS variables instead. |

### Warnings (informational, non-blocking)

| Rule ID | Description |
|---------|-------------|
| `native-button` | Native `<button>` element detected. Prefer `<Button>` from `@esparex/ui` for consistent styling and accessibility attributes. |
| `inline-color-style` | Inline style with a color hex value. Move to a CSS variable or design token. |

---

## Suppressing a Rule (Exceptions)

When a pattern is architecturally justified (e.g., mutually exclusive early-return
branches, or responsive sibling headings), suppress the specific rule on the
specific element by placing a JSX block comment **immediately above the element**:

```tsx
{/* ui-guard-ignore: nested-container Early-return branch — mutually exclusive, never nested */}
<Container variant="md" className="py-8">
  ...
</Container>
```

```tsx
{/* ui-guard-ignore: multiple-h1 Responsive sibling — mobile-only h1 paired with hidden md:block */}
<h1 className="text-sm font-semibold md:hidden">{mobileTitle}</h1>
```

### Annotation Format

Use the correct comment syntax depending on where the element appears:

**Inside JSX children** (element is a child of an open JSX parent):
```tsx
{/* ui-guard-ignore: <rule-id> [Justification] */}
<h1 className="...">...</h1>
```

**At the root of a `return (...)` expression** (cannot use JSX syntax here):
```tsx
return (
  // ui-guard-ignore: <rule-id> [Justification]
  <Container variant="md">...</Container>
);
```

- **`rule-id`** — the exact rule ID from the table above (e.g. `nested-container`).
- **Justification** — a short human-readable reason. This is mandatory for code review.

The annotation suppresses only the single element on the **immediately following line**, and only
for the specified rule. It does **not** suppress other rules or other elements.

---

## When NOT to Suppress

Do not add `ui-guard-ignore` to avoid fixing a genuine violation:

| Situation | Correct Action |
|-----------|----------------|
| Truly nested `<Container>` elements | Remove the inner Container; use `<div>` with padding utilities instead |
| Two `<h1>` elements for different content | Keep one `<h1>`; demote the second to `<h2>` or `<p>` |
| Duplicate mobile/desktop component trees | Unify into one responsive tree with CSS breakpoint utilities |
| Hardcoded hex in a new component | Map to the appropriate design token from `packages/design-tokens` |

---

## Legitimate Exception Patterns

The following patterns are architecturally valid and require `ui-guard-ignore`:

### 1. Multiple `<Container>` in early-return branches

A page that renders different states (error, loading, approved, pending) via
sequential `if (...) return (...)` branches is not nesting containers. Each
branch is mutually exclusive at runtime.

```tsx
// ✅ VALID — annotate each branch
if (hasError) {
  return (
    {/* ui-guard-ignore: nested-container Early-return branch — mutually exclusive */}
    <Container variant="md">…</Container>
  );
}
if (isPending) {
  return (
    {/* ui-guard-ignore: nested-container Early-return branch — mutually exclusive */}
    <Container variant="md">…</Container>
  );
}
```

### 2. Two `<h1>` elements as responsive siblings

A component that renders a mobile-only and a desktop-only `<h1>` using
`hidden`/`md:block` utilities has a single logical heading — the DOM just
has two representations for different viewports.

```tsx
{/* ui-guard-ignore: multiple-h1 Responsive sibling — mobile-only, hidden md:block counterpart below */}
<h1 className="md:hidden text-sm font-semibold">{mobileTitle}</h1>

<div className="hidden md:block">
  {/* ui-guard-ignore: multiple-h1 Responsive sibling — desktop-only inside hidden md:block wrapper */}
  <h1 className="text-2xl font-bold">{desktopTitle}</h1>
</div>
```

---

## Governance Integration

The guard is wired into the repository CI pipeline:

```bash
# Runs automatically as part of:
npm run governance:guards
```

It is positioned as the final step in the `governance:guards` chain, after all
structural and contract guards have passed. This sequencing ensures that UI
architecture violations only surface after more fundamental issues are resolved.

---

## File Scan Scope

By default, the guard scans `apps/web/src/**/*.{tsx,jsx}`.

The following directories are **excluded** automatically:

- `node_modules/`
- `.next/`
- `dist/`
- `coverage/`
- `__tests__/`

---

## Adding New Rules

1. Add a new entry to the `RULES` object in `scripts/guard-ui-architecture.js`.
2. Implement the detection logic in the `auditFile()` function using the
   `report()` helper.
3. Document the new rule in this file.
4. Add a test case to `scripts/__tests__/guard-ui-architecture.test.js`
   (if the test suite exists).

New error-severity rules must not introduce regressions — run the guard
against the full codebase first and annotate any existing legitimate exceptions
before wiring the rule to CI.
