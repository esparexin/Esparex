# Esparex Visual & UI/UX Anti-Pattern Registry

The following patterns are **EXPLICITLY PROHIBITED** across all Esparex repositories and applications:

---

## Prohibited UI/UX Anti-Patterns

- ❌ **Arbitrary Hex Colors**: Hardcoded inline hex values like `bg-[#123456]` or `text-[#334155]`. Must use `@esparex/design-tokens` or CSS variables.
- ❌ **Arbitrary Pixel Spacing**: Arbitrary pixel utility classes like `p-[17px]`, `mt-[13px]`, or `gap-[19px]`. Must use 4px baseline grid tokens.
- ❌ **Competing Typography Fonts**: Importing Inter, Outfit, Roboto, or custom fonts. **Geist** is the single font family SSOT.
- ❌ **Fluid Typography in Product/Admin**: Applying fluid `clamp()` sizing indiscriminately across product tables and admin UI.
- ❌ **Duplicate Responsive Components**: Creating separate component trees for viewports (e.g. `DesktopHeader.tsx` vs `MobileHeader.tsx`).
- ❌ **External Toast Packages**: Importing third-party toast libraries (`sonner`, `react-hot-toast`, `react-toastify`). Must use Esparex `popupBus`.
- ❌ **Inline String Formatting in UI**: Calculating currency or date formatting directly in React components. Must consume pre-computed fields.
- ❌ **Outline-None Without Focus Ring**: Setting `outline-none` or `ring-0` on buttons/inputs without providing a visible `focus-visible:ring-2` replacement.
- ❌ **Small Touch Targets on Mobile**: Interactive buttons or links under 44×44px on mobile viewports.
- ❌ **Bypassing `@esparex/ui` Primitives**: Creating ad-hoc card containers with raw border/shadow utility strings instead of using `<Card>`.
