# Esparex Color System Standard

## Governance Principle

> **Primitive tokens define the palette. Semantic tokens define meaning. Component tokens define implementation. Application code should consume semantic or component tokens, not raw primitives, wherever an appropriate semantic token exists.**

Application code MUST consume **semantic or component tokens** (e.g. `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`) rather than primitive color names (`bg-slate-50`, `text-slate-700`, `border-slate-200`) even if tokenized. This preserves the ability to adjust the visual theme or support dark mode without touching application code.

---

## 3-Layer Token Architecture

```text
Primitive Tokens (Palette) ──► Semantic Tokens (Meaning) ──► Component Tokens (Implementation)
```

### Layer 1: Base Primitives (`packages/design-tokens/src/colors.ts`)

- **Obsidian / Slate (Neutrals & Primary Action)**: `slate-50` (`#f8fafc`), `slate-100` (`#f1f5f9`), `slate-200` (`#e2e8f0`), `slate-500` (`#64748b`), `slate-700` (`#334155`), `slate-900` (`#0f172a`), `slate-950` (`#020617`).
- **Precision Emerald (Trust & Hardware Signal)**: `success` (`#059669` light / `#10b981` dark), `success-subtle` (`#ecfdf5` light / `#064e3b` dark) — dedicated to Verified badges, "Power ON", and pricing.
- **Status Signals**: `warning` (`#d97706`), `error` (`#dc2626`), `info` (`#2563eb`).

---

### Layer 2: Semantic Tokens (Must Consume in App Code)

| Semantic Token | Intended Meaning | Light Base | Dark Base |
|---|---|---|---|
| `bg-background` | App root background | `slate-50` (`#f8fafc`) | `slate-950` (`#020617`) |
| `bg-card` / `bg-surface` | Data surface container | `#ffffff` | `slate-900` (`#0f172a`) |
| `text-foreground` | Main body & title text | `slate-900` (`#0f172a`) | `slate-50` (`#f8fafc`) |
| `text-muted-foreground` | Timestamps, helper text, subtitles | `slate-500` (`#64748b`) | `slate-400` (`#94a3b8`) |
| `border-border` / `border-subtle` | Structural dividers, input borders | `slate-200` (`#e2e8f0`) | `slate-800` (`#1e293b`) |
| `bg-primary` / `text-action` | Primary interactive controls & CTAs | `blue-600` (`#2563eb` Royal Blue) | `blue-500` (`#3b82f6`) |
| `text-success` / `bg-success` | Trust signals, prices, condition ON | `emerald-600` (`#059669`) | `emerald-500` (`#10b981`) |
| `bg-destructive` | Danger buttons & destructive actions | `error` (`#dc2626`) | `error` (`#dc2626`) |

---

## Preferred vs Prohibited Usage Matrix

```tsx
// ❌ PROHIBITED: Hardcoded arbitrary hex colors
<div className="bg-[#123456] text-[#334155] border-[#cbd5e1]">

// ⚠️ DISCOURAGED: Using primitive token names directly in application code
<div className="bg-slate-50 text-slate-700 border-slate-200">

// ✅ MANDATORY: Consuming semantic tokens that carry intent and support dark mode
<div className="bg-background text-foreground border-border">
```
