# Esparex Component Architecture Standard

## Single Component Source of Truth (`@esparex/ui` & `@esparex/mobile-ui`)

All foundational UI primitives MUST be imported from `@esparex/ui` (web) or `@esparex/mobile-ui` (mobile).
Local component duplicates inside `apps/web/src/components/ui` or `apps/admin/src/components/ui` are strictly forbidden.

---

## Primitive Guidelines

### 1. `<Button>`
- **Action variant**: `bg-action text-white hover:bg-action-dark` (`#2563eb`). Primary CTAs.
- **Brand variant**: `bg-brand-600 text-white hover:bg-brand-700` (`#0284c7`). Feature highlights.
- **Destructive variant**: `bg-error text-white hover:bg-error-dark` (`#ef4444`). Delete / cancel actions.
- **Secondary variant**: `bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200`. Neutral options.
- **Height**: Minimum 44px on touch devices; 36px–40px in high-density Admin panels.

### 2. `<Card>`
- Surfaces MUST consume `@esparex/ui` `<Card>`, `<CardHeader>`, `<CardContent>`, `<CardFooter>`.
- Do not bypass `Card` by creating ad-hoc `div` elements with raw `border border-slate-200 shadow-sm` utility strings.

### 3. `<Dialog>` / `<Drawer>`
- Modals MUST use `role="dialog"`, `aria-modal="true"`, focus trapping, and `Escape` key dismissal.
- Backdrops MUST use glassmorphic blur: `bg-slate-950/50 backdrop-blur-xs`.
- Focus MUST be restored to the triggering element when closed.

### 4. Form Inputs (`<Input>`, `<Select>`, `<Checkbox>`)
- Inputs MUST have explicit `<label>` tags with matching `htmlFor` / `id`.
- Error messages MUST be linked via `aria-describedby` or `aria-invalid="true"`.
- Focus states MUST display a visible focus ring (`focus-visible:ring-2 focus-visible:ring-action/20`).
