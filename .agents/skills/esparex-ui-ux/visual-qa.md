# Esparex Visual QA & Canvas Inspection Protocol

## 1. Overview & Tools

Visual QA ensures that code implementations strictly reflect `@esparex/design-tokens` and Esparex UI/UX layout standards.

- **Pencil MCP (`pencil`)**: Use Pencil MCP for visual canvas inspection, element placement verification, and layout bounds checking.
- **Chrome DevTools MCP**: Use Chrome DevTools MCP for browser interaction, screenshot capture, DOM tree inspection, and contrast audits.

---

## 2. Visual QA Verification Checklist

Before marking any UI task complete, perform this 6-point checklist:

- [ ] **Design Token Verification**: Confirm zero arbitrary hex colors (`text-[#334155]`) or arbitrary pixel margins (`mt-[17px]`).
- [ ] **Geist Typography Verification**: Confirm font family uses `--font-primary` (Geist) with valid discrete font-size tokens.
- [ ] **Single-Instance Responsiveness**: Confirm layout scales smoothly from `375px` mobile to `1440px` desktop without separate `Desktop*` vs `Mobile*` components.
- [ ] **Interaction States**: Confirm `hover`, `focus-visible`, `disabled`, and `loading` states are visually clear and accessible.
- [ ] **Accessibility Audit**: Confirm text contrast meets WCAG 2.2 AA (4.5:1 text, 3:1 graphic objects) and focus rings are visible on `Tab`.
- [ ] **Native Popup Integration**: Confirm popups use `popupBus` / `notify`. Zero third-party toast containers rendered.
