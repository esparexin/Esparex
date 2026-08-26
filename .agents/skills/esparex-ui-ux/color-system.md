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

- **Brand (Electric Sky Blue)**: `brand-50` (`#f0f9ff`), `brand-500` (`#0ea5e9`), `brand-600` (`#0284c7`), `brand-950` (`#082f49`).
- **Action (Interactive Indigo)**: `action` (`#2563eb`). Primary interactive controls, buttons, links, price highlights.
- **Slate (Neutrals)**: `slate-50` (`#f8fafc`), `slate-100` (`#f1f5f9`), `slate-200` (`#e2e8f0`), `slate-500` (`#64748b`), `slate-700` (`#334155`), `slate-900` (`#0f172a`), `slate-950` (`#020617`).
- **Status Signals**: `success` (`#10b981`), `error` (`#ef4444`), `warning` (`#f59e0b`), `info` (`#3b82f6`).

---

### Layer 2: Semantic Tokens (Must Consume in App Code)

| Semantic Token | Intended Meaning | Light Base | Dark Base |
|---|---|---|---|
| `bg-background` | App root background | `slate-50` | `slate-950` |
| `bg-card` / `bg-surface` | Data surface container | `#ffffff` | `slate-900` |
| `text-foreground` | Main body & title text | `slate-950` | `slate-50` |
| `text-muted-foreground` | Timestamps, helper text, subtitles | `slate-500` | `slate-400` |
| `border-border` / `border-subtle` | Structural dividers, input borders | `slate-200` | `slate-800` |
| `bg-primary` / `text-action` | Primary interactive controls & badges | `brand-600` / `action` | `brand-500` |
| `bg-destructive` | Danger buttons & destructive actions | `error` | `error` |

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
