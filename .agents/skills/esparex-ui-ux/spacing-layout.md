# Esparex Spacing & Layout Standard

## 4px Baseline Grid (`packages/design-tokens/src/spacing.ts`)

Esparex layouts enforce a 4px baseline grid to maintain consistent vertical and horizontal rhythm.

| Token | Size | Purpose |
|---|---|---|
| `space-1` | `4px` | Micro spacing (icon-to-text gap) |
| `space-2` | `8px` | Badge/chip internal padding, tight stack gap |
| `space-3` | `12px` | Form input internal horizontal padding |
| `space-4` | `16px` | Standard card internal padding, component gap |
| `space-6` | `24px` | Card section gap, container grid gap |
| `space-8` | `32px` | Major section gap, page header margin |
| `space-12` | `48px` | Main layout container padding |

---

## Layout Containment Hierarchy

Every layout MUST follow the single-responsibility containment hierarchy:
`PageShell` $\rightarrow$ `Container` $\rightarrow$ `Section` $\rightarrow$ `Card` $\rightarrow$ `Content`.

- **PageShell**: Handles overall responsive layout, navigation sidebar, and background.
- **Container**: Enforces maximum width bounds (`max-w-7xl` or `max-w-5xl`) and horizontal gutters.
- **Section**: Groups related cards/content blocks with standard vertical spacing (`space-y-6`).
- **Card**: Renders white/dark bounded data surfaces with consistent border & shadow.

---

## Prohibited Spacing Anti-Patterns

```tsx
// ❌ PROHIBITED: Arbitrary pixel margins or duplicate wrappers
<div className="mt-[13px] p-[19px] mb-[31px]">
  <div className="p-4">
    <Card className="p-6"> ... </Card>
  </div>
</div>

// ✅ MANDATORY: Standard design token grid gaps and containment
<Section className="space-y-6">
  <Card className="p-6"> ... </Card>
</Section>
```
