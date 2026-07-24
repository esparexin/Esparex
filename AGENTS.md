# Esparex AGENTS.md — Architecture Governance

## Similarity Threshold Rule

Components, hooks, or services must not be merged solely because they appear similar. Before consolidation, document:

- Shared UI %
- Shared business rules %
- Shared validation %
- Shared API contract %
- Shared workflow %

Consolidation is recommended only when overall similarity > 75% AND no single dimension is < 50%.

If similarity is below the threshold, keep components separate even if they appear structurally similar. Different responsibilities, future trajectory, and domain-specific behavior must be preserved.

---

# 🚨 GLOBAL ACCESSIBILITY & KEYBOARD NAVIGATION GOVERNANCE RULE (MANDATORY)

## Applies To

This rule applies to **every user-facing interface** across the entire Esparex platform.

- User Web App
- Admin Dashboard
- Mobile Web
- Progressive Web App (PWA)
- Authentication
- Forms
- Modals
- Drawers
- Dropdowns
- Tables
- Search
- Filters
- Wizards
- Settings
- Dashboards
- Chat
- Payments
- Every future UI component

No exceptions.

---

## 🚨 ACCESSIBILITY FIRST

Before creating, modifying, or fixing any UI component, perform a complete accessibility and keyboard audit.

Never implement or modify a component without verifying accessibility.

Accessibility is a **mandatory engineering requirement**, not a post-development enhancement.

---

## 1. Keyboard Navigation (Mandatory)

Every interactive element must be fully usable without a mouse.

Verify support for:

- Tab
- Shift + Tab
- Enter
- Space
- Escape
- Arrow Keys
- Home
- End

Every component must have:

- Logical tab order
- Visible focus indicator
- No skipped elements
- No keyboard traps
- Predictable navigation

---

## 2. Focus Management

Every screen must maintain proper focus behavior.

Verify:

- Initial focus
- Focus order
- Focus restoration
- Focus trapping in dialogs
- Focus after validation errors
- Focus after dynamic content updates

Users must never lose keyboard focus.

---

## 3. ARIA Compliance

Every interactive component must use appropriate ARIA attributes where required.

Audit:

- `aria-label`
- `aria-labelledby`
- `aria-describedby`
- `aria-invalid`
- `aria-required`
- `aria-expanded`
- `aria-controls`
- `aria-selected`
- `aria-checked`
- `aria-current`
- `aria-live`
- `aria-modal`

Do not add ARIA attributes unnecessarily. Prefer semantic HTML first, then use ARIA only where needed.

---

## 4. Semantic HTML First

Always prefer native HTML elements.

Examples:

- `<button>` instead of clickable `<div>`
- `<input>`
- `<label>`
- `<select>`
- `<fieldset>`
- `<legend>`

Never replace semantic elements with custom components unless there is a clear functional requirement.

---

## 5. Forms

Every form must support:

- Keyboard-only navigation
- Proper label association
- Required field indication
- Error announcements
- Helper text association
- Correct validation feedback

Every input must remain accessible.

---

## 6. Custom Components

Custom UI components must behave like native controls.

Examples:

- Cards
- Chips
- Tabs
- Toggles
- Dropdowns
- Comboboxes
- Multi-selects
- Date Pickers
- Image Uploaders

Verify:

- Keyboard navigation
- Selection via keyboard
- Focus visibility
- Correct state announcements

---

## 7. Modal & Dialog Rules

Every modal must:

- Use `role="dialog"` (or `alertdialog` where appropriate)
- Use `aria-modal="true"`
- Associate a title correctly
- Trap keyboard focus
- Close with Escape (unless intentionally prevented)
- Restore focus to the triggering element when closed

Background content must not be keyboard-accessible while the dialog is open.

---

## 8. Validation & Error Handling

Validation must be accessible.

Verify:

- Errors are linked to the relevant fields
- Errors are announced appropriately
- Focus moves to the first invalid field when submission fails
- Success and status messages are communicated accessibly

---

## 9. Screen Reader Compatibility

Every UI must be usable with common screen readers.

Verify compatibility with:

- VoiceOver
- NVDA
- TalkBack
- JAWS (where applicable)

Ensure:

- Correct reading order
- Meaningful control names
- Accurate state announcements
- Proper dialog and navigation announcements

---

## 10. Mobile Accessibility

Verify:

- Touch targets meet minimum size recommendations
- Virtual keyboard does not obscure active inputs
- Sticky headers/footers do not hide focused controls
- Portrait and landscape layouts remain accessible

---

## 11. WCAG 2.2 AA Compliance

All interfaces must meet WCAG 2.2 AA requirements where applicable.

Audit:

- Keyboard Accessibility
- Focus Visible
- Focus Order
- Labels and Instructions
- Error Identification
- Name, Role, Value
- Reflow
- Target Size
- Status Messages
- Color Contrast

---

## 12. Accessibility Audit Before Every UI Change

Before implementing any UI change, complete:

- Accessibility Audit
- Keyboard Navigation Audit
- Focus Management Audit
- ARIA Audit
- Screen Reader Audit
- Mobile Accessibility Audit

Fix the root cause before adding new functionality.

---

## 13. Testing Requirements

Every UI feature must be manually verified using:

- Keyboard only
- Mouse only
- Touch only (where applicable)
- Screen reader
- Desktop
- Tablet
- Mobile

Accessibility testing is required before considering a feature complete.

---

## Required Deliverables

For every UI implementation or modification, provide:

1. Accessibility Audit Summary
2. Keyboard Navigation Report
3. Focus Management Report
4. ARIA Compliance Report
5. Screen Reader Compatibility Report
6. WCAG 2.2 AA Compliance Summary
7. Accessibility Issues Found
8. Root Cause Analysis (if issues exist)
9. Minimal Fix Plan
10. Final Verification Confirmation

---

## Success Criteria

A UI change is considered complete only if:

- ✅ Fully operable using keyboard only
- ✅ Proper focus management
- ✅ Uses semantic HTML where possible
- ✅ ARIA implemented correctly where required
- ✅ Screen reader compatible
- ✅ Mobile accessible
- ✅ WCAG 2.2 AA compliant
- ✅ No keyboard traps
- ✅ No inaccessible interactive elements
- ✅ Existing functionality and workflow remain unchanged

**Accessibility is a mandatory quality gate for every user interface across the Esparex platform and must be validated before implementation, modification, or release.**

---

## 🚫 Accessibility Enforcement Gate (Mandatory)

No UI task may be marked complete, merged, or deployed unless the following gates pass.

The implementation **must not**:

- Introduce keyboard traps.
- Break existing keyboard navigation.
- Remove visible focus indicators.
- Replace semantic HTML with non-semantic elements without a justified reason.
- Introduce inaccessible custom controls.
- Break screen reader compatibility.
- Reduce WCAG 2.2 AA compliance.

If any of the above occur:

- Stop implementation.
- Identify the root cause.
- Fix the accessibility issue before continuing.
- Do not add workarounds that bypass accessibility.

Accessibility regressions are treated as functional regressions.

---

## Accessibility Regression Rule

Every UI modification must preserve or improve accessibility.

If an existing accessible behavior is degraded, the change is considered a failed implementation, even if the feature works visually.

---

## Pull Request Requirement

Every UI-related pull request must include confirmation that:

- Keyboard navigation was tested.
- Focus order was verified.
- Screen reader compatibility was checked where applicable.
- ARIA attributes were reviewed.
- WCAG 2.2 AA compliance was considered.
- No accessibility regressions were introduced.

---

## Definition of Done

A UI feature is **not complete** until all of the following are true:

- Functional requirements are satisfied.
- Responsive behavior is verified.
- Accessibility requirements are satisfied.
- Keyboard navigation is fully operational.
- Focus management is correct.
- Screen reader support is verified where applicable.
- No accessibility regressions remain.

---

## 🚨 SINGLE-INSTANCE RESPONSIVE ARCHITECTURE GOVERNANCE (MANDATORY)

Every user-facing screen, layout, header, footer, form, modal, and control across the platform MUST be rendered from a **single responsive component instance**.

### Mandatory Rules:
1. **No Duplicate Top-Level Components**: Never create separate component files or trees for different viewports (e.g. forbid `DesktopHeader` vs `MobileHeader`, `DesktopFooter` vs `MobileFooter`). Use a single component with CSS breakpoint utilities (`hidden md:flex`, `flex md:hidden`).
2. **CSS-Driven Responsiveness First**: Responsive behavior (grid columns, flex direction, padding, margins, visibility) MUST be driven by CSS media query utilities (`sm:`, `md:`, `lg:`, `xl:`).
3. **JS Viewport Check Restrictions**: JavaScript window checks (`useIsMobile`, `window.innerWidth`) are forbidden for static layout branching. JS checks are permitted ONLY for dynamic canvas calculations (e.g., virtualized list lane count) or event backdrop dismissal.
4. **Accessible Overlays & Focus Trapping**: Hidden subtrees (mobile drawers, navigation sheets) MUST use the `inert` attribute and trap focus properly to prevent keyboard navigation leaks (`Tab` focus traversal).

