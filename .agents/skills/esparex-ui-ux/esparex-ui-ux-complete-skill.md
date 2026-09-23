---
name: esparex-ui-ux
description: "Authoritative Esparex UI/UX Skill: design system tokens, Geist typography, responsive architecture, WCAG 2.2 AA accessibility, native popup bus, Admin density, Marketplace UX, and visual QA. Includes code examples, checklists, and decision trees."
argument-hint: "[component|page|view] [web|admin|mobile]"
license: MIT
quality_score: "9/10"
maturity: "production"
metadata:
  author: esparex
  version: "2.0.0"
  last_updated: "2026-09-21"
  status: "Active"
---

# ⭐ Esparex UI/UX Design System & Experience Skill v2.0

**Complete, actionable guide with examples, checklists, and decision trees for building consistent, accessible UIs across web, admin, and mobile.**

---

## 🚨 Non-Negotiable Core Laws

These rules are **MANDATORY**. No exceptions.

### 1️⃣ Semantic Token Consumption Principle
**Rule**: Use semantic tokens, NOT primitive colors.

```jsx
❌ DON'T:
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Click Me
</button>

✅ DO:
<button className="bg-primary text-primary-foreground px-3 py-2 
  rounded-md border border-border hover:bg-primary/90 
  focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Click Me
</button>

✅ ALSO GOOD (Semantic):
<button className="bg-background text-foreground px-3 py-2 
  rounded-md border border-border hover:bg-muted 
  focus-visible:ring-2 focus-visible:ring-ring">
  Secondary Button
</button>
```

**Why**: Tokens adapt to dark mode, brand changes, and accessibility needs automatically.

**Tokens to Use**:
- Colors: `bg-primary`, `bg-secondary`, `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `border-destructive`
- Spacing: Use Tailwind scale (`px-2`, `py-3`, `gap-4`) - NOT arbitrary (`p-[17px]`)
- Border radius: `rounded-sm`, `rounded-md`, `rounded-lg` - NOT arbitrary (`rounded-[13px]`)

---

### 2️⃣ Design Token SSOT (@esparex/design-tokens)
**Rule**: All colors, spacing, shadows, radii come from `@esparex/design-tokens`.

```jsx
✅ CORRECT:
import { colors, spacing } from '@esparex/design-tokens';

<div style={{ 
  backgroundColor: colors.semantic.background,
  padding: spacing.md,
  borderRadius: spacing.borderRadius.md
}}>
  Content
</div>

❌ WRONG:
<div style={{ 
  backgroundColor: '#f5f5f5',  // ❌ Arbitrary color
  padding: '17px',             // ❌ Arbitrary spacing
  borderRadius: '13px'         // ❌ Arbitrary radius
}}>
  Content
</div>
```

**Installation**:
```bash
npm install @esparex/design-tokens
```

**Usage in CSS**:
```css
/* Use CSS variables */
.card {
  background: var(--color-background);
  color: var(--color-foreground);
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
```

---

### 3️⃣ Typography SSOT (Geist Font)
**Rule**: Use ONLY Geist font family. No Inter, Roboto, Outfit.

```jsx
✅ CORRECT:
<h1 className="font-primary text-4xl font-bold">
  Heading
</h1>

❌ WRONG:
<h1 className="font-inter text-4xl font-bold">  // ❌ No Inter
  Heading
</h1>

<h1 style={{ fontFamily: 'Roboto' }}>  // ❌ No Roboto
  Heading
</h1>
```

**Setup**:
```css
/* In global CSS */
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap');

:root {
  --font-primary: 'Geist', sans-serif;
}

body {
  font-family: var(--font-primary);
}
```

**Type Scale** (use these classes):
```
text-tiny        → 12px
text-sm          → 14px
text-base        → 16px (default)
text-lg          → 18px
text-xl          → 20px
text-2xl         → 24px
text-3xl         → 30px
text-4xl         → 36px
display          → 48px+ (hero text)
```

---

### 4️⃣ Single-Instance Responsive Architecture
**Rule**: ONE component that works everywhere. NO separate `MobileNav` + `DesktopNav`.

```jsx
❌ WRONG (component duplication):
export const Nav = () => {
  const isMobile = useMedia('(max-width: 768px)');
  if (isMobile) return <MobileNav />;
  return <DesktopNav />;
}

❌ STILL WRONG:
export const MobileNav = () => { ... }
export const DesktopNav = () => { ... }
// Two separate components!

✅ CORRECT (single responsive component):
export const Nav = () => {
  return (
    <nav className="flex flex-col gap-2 md:flex-row md:gap-4 lg:gap-6">
      <Link className="text-sm md:text-base">Home</Link>
      <Link className="text-sm md:text-base">About</Link>
      <Link className="text-sm md:text-base">Contact</Link>
      
      {/* Mobile-only button */}
      <button className="md:hidden bg-primary text-primary-foreground px-3 py-2 rounded">
        Menu
      </button>
      
      {/* Desktop-only nav */}
      <div className="hidden md:flex gap-2">
        <Link>Pricing</Link>
        <Link>Docs</Link>
      </div>
    </nav>
  );
};
```

**Responsive Classes**:
```
hidden                    → display: none
md:block                  → display: block at 768px+
lg:flex                   → display: flex at 1024px+
flex-col md:flex-row      → column on mobile, row on desktop
grid-cols-1 md:grid-cols-2 lg:grid-cols-3  → responsive grid
w-full md:w-1/2           → full width mobile, half width desktop
```

**Breakpoints**:
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

---

### 5️⃣ Native Popup SSOT
**Rule**: Use ONLY `popupBus`/`notify`. NO Sonner, NO React-hot-toast.

```jsx
✅ CORRECT:
import { popupBus } from '@esparex/popup-bus';

export const MyComponent = () => {
  const handleSave = async () => {
    try {
      await saveData();
      popupBus.notify({
        type: 'success',
        title: 'Saved!',
        message: 'Your data has been saved.',
        duration: 3000
      });
    } catch (error) {
      popupBus.notify({
        type: 'error',
        title: 'Error',
        message: error.message,
        action: { label: 'Retry', onClick: handleSave }
      });
    }
  };

  return (
    <button onClick={handleSave} className="bg-primary text-primary-foreground px-4 py-2 rounded">
      Save
    </button>
  );
};

❌ WRONG:
import { toast } from 'sonner';  // ❌ BANNED

toast.success('Saved!');  // ❌ BANNED
```

**Popup Types**:
```javascript
// Success
popupBus.notify({
  type: 'success',
  title: 'Success',
  message: 'Action completed',
  duration: 3000
});

// Error
popupBus.notify({
  type: 'error',
  title: 'Error',
  message: 'Something went wrong',
  action: { label: 'Retry', onClick: handleRetry }
});

// Info
popupBus.notify({
  type: 'info',
  title: 'Information',
  message: 'FYI: This feature is new',
});

// Warning
popupBus.notify({
  type: 'warning',
  title: 'Warning',
  message: 'This action cannot be undone',
});
```

---

### 6️⃣ WCAG 2.2 AA Compliance (MANDATORY)
**Rule**: All components must pass WCAG 2.2 AA accessibility standards.

---

## ✅ A11y Compliance Checklist (BEFORE LAUNCHING)

**Use this checklist for EVERY component you build:**

```
ACCESSIBILITY CHECKLIST - DO THIS BEFORE CODE REVIEW
═══════════════════════════════════════════════════════

CONTRAST & COLOR
☐ Text contrast is 4.5:1 or higher?
  → Test with: https://www.tpgi.com/color-contrast-checker/
  → WCAG Rule: Dark text on light = minimum 4.5:1
  → Light text on dark = minimum 4.5:1
  
☐ Color is NOT the only way to convey information?
  → ✓ Use icon + color (not color alone)
  → ✓ Use text + color (not color alone)
  → Example: ✓ "✓ Success" (not just green)
  
☐ Dark mode has correct contrast?
  → Test: Toggle dark mode in browser
  → All text should still be readable

KEYBOARD & FOCUS
☐ Component works with keyboard ONLY?
  → Test: Unplug mouse, use only Tab/Enter/Escape
  → All buttons must be reachable with Tab
  → Focus must move in logical order
  
☐ Focus ring is VISIBLE on all interactive elements?
  → Add: focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  → Test: Press Tab - see blue ring appear
  → Ring should be at least 2px thick, high contrast
  
☐ Escape key closes modals/dropdowns?
  → onClick: Should handle Escape key
  → Test: Open dialog, press Escape, it closes

TOUCH & MOBILE
☐ All touch targets are 44×44px or larger?
  → Test: px-3 py-2 = 12px + 16px = 28px (TOO SMALL)
  → Fix: px-4 py-3 = 16px + 24px = 40px (OK)
  → Better: px-5 py-3 = 20px + 24px = 44px+ (GOOD)
  → Measure: Use Chrome DevTools > click element > see size
  
☐ Touch targets have spacing between them?
  → Minimum 8px between clickable elements
  → Prevents accidental clicks

SCREEN READERS & ARIA
☐ All icons have labels?
  → <button aria-label="Close menu">✕</button>
  → <svg role="img" aria-label="Loading..."></svg>
  
☐ Form labels are connected to inputs?
  → <label htmlFor="email">Email</label>
  → <input id="email" type="email" />
  
☐ Semantic HTML is used?
  → <button> NOT <div onClick>
  → <nav> for navigation
  → <main> for main content
  → <article> for articles
  → <h1>-<h6> for headings (in order)
  
☐ Error messages are announced?
  → <input aria-invalid="true" aria-describedby="error" />
  → <span id="error" className="text-destructive">Email is required</span>
  
☐ Loading/async states are announced?
  → <button aria-busy="true">Loading...</button>
  → Screen readers say "Loading, please wait"

TABLE & DATA
☐ Tables have proper headers?
  → <th> for header cells (NOT <td>)
  → <thead>, <tbody>, <tfoot> used correctly
  
☐ Table headers are scoped?
  → <th scope="col">Name</th>
  → <th scope="row">John</th>

TESTING TOOLS
─────────────
1. axe DevTools (Chrome extension)
   → Right-click > "Scan page with axe"
   → Shows all a11y violations
   → Fix all CRITICAL + SERIOUS issues

2. WAVE (Chrome extension)
   → Shows contrast issues, aria problems
   → Visual indicator on page

3. Keyboard Testing
   → Unplug mouse
   → Tab through entire component
   → All elements reachable? Yes ✓

4. Screen Reader Testing
   → Windows: NVDA (free)
   → Mac: VoiceOver (built-in, Cmd+F5)
   → Read component aloud - does it make sense?

SIGN-OFF
────────
If all boxes ✓: Component is WCAG 2.2 AA compliant
If any box ✗: Component must be fixed before merge
```

**Quick A11y Test** (2 minutes):
```
1. Press Tab key 5 times → can you focus all buttons? YES ✓
2. Press Tab to focus button → see blue ring? YES ✓
3. Press Enter → does it work? YES ✓
4. Open in dark mode → text still readable? YES ✓
5. Run axe DevTools → 0 errors? YES ✓
```

---

## 🎯 Quick Decision Tree

**Use this to answer common questions in 30 seconds:**

```
┌─────────────────────────────────────────────────────────┐
│ "I NEED TO BUILD..."                                    │
└─────────────────────────────────────────────────────────┘

1️⃣  A BUTTON
    → Check @esparex/ui library first
    → Don't have it? Use this:
       
       <button className="bg-primary text-primary-foreground 
         px-4 py-2 rounded-md border-0 hover:bg-primary/90
         focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
         disabled:opacity-50 disabled:cursor-not-allowed">
         Click Me
       </button>
    
    → Test: hover, focus (Tab), disabled state
    ✓ Done!

───────────────────────────────────────────────────────────

2️⃣  A FORM INPUT (TEXT, EMAIL, PASSWORD)
    → Use semantic tokens + ARIA labels
       
       <div>
         <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
           Email Address
         </label>
         <input
           id="email"
           type="email"
           placeholder="you@example.com"
           className="w-full px-3 py-2 rounded-md border border-border 
             bg-background text-foreground placeholder:text-muted-foreground
             focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
             disabled:opacity-50 disabled:cursor-not-allowed"
           required
         />
         {error && (
           <span id="email-error" className="text-sm text-destructive mt-1">
             {error}
           </span>
         )}
       </div>
    
    → Remember: label + input must match (htmlFor + id)
    → Error messages should use aria-describedby
    ✓ Done!

───────────────────────────────────────────────────────────

3️⃣  A CARD / CONTAINER
    → Use Card from @esparex/ui OR:
       
       <div className="rounded-lg border border-border bg-card 
         p-4 md:p-6 shadow-sm">
         <h3 className="text-lg font-semibold text-foreground mb-2">
           Card Title
         </h3>
         <p className="text-sm text-muted-foreground">
           Card description
         </p>
       </div>
    
    → Spacing: p-4 (mobile), md:p-6 (desktop)
    → Shadow: shadow-sm (subtle)
    ✓ Done!

───────────────────────────────────────────────────────────

4️⃣  A MODAL / DIALOG
    → Use Dialog from @esparex/ui OR:
       
       <div className="fixed inset-0 z-50 flex items-center justify-center 
         bg-black/50">
         <div className="rounded-lg bg-background border border-border 
           p-6 shadow-lg max-w-md w-full">
           <h2 className="text-xl font-semibold text-foreground mb-4">
             Dialog Title
           </h2>
           <p className="text-sm text-muted-foreground mb-6">
             Dialog content
           </p>
           <div className="flex gap-2 justify-end">
             <button 
               onClick={onClose}
               className="px-4 py-2 rounded-md border border-border 
                 bg-background hover:bg-muted text-foreground">
               Cancel
             </button>
             <button 
               onClick={onConfirm}
               className="px-4 py-2 rounded-md bg-primary 
                 text-primary-foreground hover:bg-primary/90">
               Confirm
             </button>
           </div>
         </div>
       </div>
    
    → Close on Escape key: onKeyDown={(e) => e.key === 'Escape' && onClose()}
    → Focus trap: first element focused when opened
    ✓ Done!

───────────────────────────────────────────────────────────

5️⃣  A POPUP / TOAST / NOTIFICATION
    → Use ONLY popupBus (NOT sonner!)
       
       import { popupBus } from '@esparex/popup-bus';
       
       popupBus.notify({
         type: 'success',
         title: 'Success!',
         message: 'Your changes have been saved.',
         duration: 3000
       });
    
    ✓ Done! (popupBus handles styling, accessibility, positioning)

───────────────────────────────────────────────────────────

6️⃣  A TABLE
    → Use semantic HTML + semantic tokens
       
       <table className="w-full border-collapse">
         <thead>
           <tr className="border-b border-border bg-muted">
             <th className="text-left px-4 py-2 font-semibold text-foreground">Name</th>
             <th className="text-left px-4 py-2 font-semibold text-foreground">Email</th>
             <th className="text-left px-4 py-2 font-semibold text-foreground">Status</th>
           </tr>
         </thead>
         <tbody>
           {users.map(user => (
             <tr key={user.id} className="border-b border-border hover:bg-muted/50">
               <td className="px-4 py-3 text-foreground">{user.name}</td>
               <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
               <td className="px-4 py-3">
                 <span className={`px-2 py-1 rounded-full text-xs font-medium 
                   ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                   {user.active ? 'Active' : 'Inactive'}
                 </span>
               </td>
             </tr>
           ))}
         </tbody>
       </table>
    
    → Use <thead>, <tbody>, proper <th> elements
    → Hover rows for better UX
    ✓ Done!

───────────────────────────────────────────────────────────

7️⃣  MOBILE & DESKTOP UI (SAME COMPONENT)
    → Use responsive Tailwind classes
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {items.map(item => (
           <Card key={item.id}>
             <h3 className="text-lg md:text-xl font-semibold">{item.name}</h3>
             <p className="text-sm md:text-base text-muted-foreground">{item.desc}</p>
           </Card>
         ))}
       </div>
    
    → Mobile: 1 column
    → Tablet (md): 2 columns
    → Desktop (lg): 3 columns
    → ONE component, responsive!
    ✓ Done!

───────────────────────────────────────────────────────────

8️⃣  HIDDEN/SHOW ELEMENT BY SCREEN SIZE
    → Use hidden + responsive classes
       
       <nav className="flex flex-col md:flex-row gap-2">
         {/* Mobile menu button */}
         <button className="md:hidden bg-primary text-primary-foreground px-3 py-2">
           Menu
         </button>
         
         {/* Desktop nav items */}
         <div className="hidden md:flex gap-4">
           <a href="#home">Home</a>
           <a href="#about">About</a>
         </div>
       </nav>
    
    → hidden = display: none
    → md:block = display: block at 768px+
    → lg:flex = display: flex at 1024px+
    ✓ Done!

───────────────────────────────────────────────────────────

9️⃣  DARK MODE (AUTOMATIC)
    → Just use semantic tokens, dark mode works automatically!
       
       <div className="bg-background text-foreground">
         Light bg in light mode, dark bg in dark mode ✓
       </div>
    
    → No need to manually handle dark mode
    → Tokens already include light/dark values
    ✓ Done!

───────────────────────────────────────────────────────────

🔟  SOMETHING NOT ON THIS LIST?
    1. Check @esparex/ui component library first
    2. Check components.md reference guide
    3. Ask senior dev / #design-system Slack
```

---

## ❌ Anti-Patterns (DON'T DO THIS)

```javascript
❌ ANTI-PATTERN #1: Arbitrary Colors
<div className="bg-[#ff6b6b] text-[#2d3748]">
❌ WRONG - Not tokenized, won't work in dark mode

✅ FIX:
<div className="bg-primary text-foreground">
✅ RIGHT - Uses semantic tokens


❌ ANTI-PATTERN #2: Duplicate Mobile/Desktop Components
export const Nav = () => {
  if (isMobile) return <MobileNav />;
  return <DesktopNav />;
}
❌ WRONG - Code duplication, maintenance nightmare

✅ FIX:
export const Nav = () => (
  <nav className="flex flex-col md:flex-row">
    {/* Single responsive component */}
  </nav>
)
✅ RIGHT - One component, responsive classes


❌ ANTI-PATTERN #3: Using Sonner Toast
import { toast } from 'sonner';
toast.success('Saved!');
❌ WRONG - Uses external library, inconsistent with design system

✅ FIX:
import { popupBus } from '@esparex/popup-bus';
popupBus.notify({ type: 'success', title: 'Saved!' });
✅ RIGHT - Uses design system popup bus


❌ ANTI-PATTERN #4: Arbitrary Spacing/Padding
<button className="p-[17px] m-[23px]">
❌ WRONG - Not on 4px baseline grid

✅ FIX:
<button className="px-4 py-2 m-4">
✅ RIGHT - Uses 4px grid (16px, 8px, 16px)


❌ ANTI-PATTERN #5: Non-Geist Font
<h1 style={{ fontFamily: 'Inter' }}>
❌ WRONG - Not the system font

✅ FIX:
<h1 className="font-primary">
✅ RIGHT - Uses Geist (--font-primary)


❌ ANTI-PATTERN #6: No Focus Ring
<button className="bg-primary px-4 py-2">
❌ WRONG - Not accessible, no focus indicator

✅ FIX:
<button className="bg-primary px-4 py-2 
  focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
✅ RIGHT - Has visible focus ring


❌ ANTI-PATTERN #7: Button as DIV
<div onClick={handleClick} className="cursor-pointer">
  Click me
</div>
❌ WRONG - Not keyboard accessible, screen reader doesn't see it

✅ FIX:
<button onClick={handleClick}>
  Click me
</button>
✅ RIGHT - Proper semantic HTML
```

---

## 📋 Component Examples

### Button Component (All Variants)
```jsx
// Primary Button
<button className="bg-primary text-primary-foreground px-4 py-2 rounded-md 
  hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring 
  focus-visible:ring-offset-2 disabled:opacity-50">
  Primary
</button>

// Secondary Button
<button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md 
  hover:bg-secondary/90 focus-visible:ring-2 focus-visible:ring-ring 
  focus-visible:ring-offset-2 disabled:opacity-50">
  Secondary
</button>

// Outline Button
<button className="border border-border bg-background text-foreground px-4 py-2 
  rounded-md hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring 
  focus-visible:ring-offset-2 disabled:opacity-50">
  Outline
</button>

// Destructive Button
<button className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md 
  hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-ring 
  focus-visible:ring-offset-2 disabled:opacity-50">
  Delete
</button>

// Ghost Button
<button className="bg-transparent text-foreground px-4 py-2 rounded-md 
  hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring 
  focus-visible:ring-offset-2 disabled:opacity-50">
  Ghost
</button>

// Loading Button
<button disabled className="bg-primary text-primary-foreground px-4 py-2 
  rounded-md opacity-70 cursor-not-allowed flex items-center gap-2">
  <Spinner className="w-4 h-4 animate-spin" />
  Loading...
</button>
```

### Form Input Component
```jsx
<div className="w-full">
  <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
    Username
  </label>
  <input
    id="username"
    type="text"
    placeholder="Enter your username"
    className="w-full px-3 py-2 rounded-md border border-border bg-background 
      text-foreground placeholder:text-muted-foreground
      focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      aria-invalid={error ? 'true' : 'false'}"
    aria-describedby={error ? 'username-error' : undefined}
  />
  {error && (
    <p id="username-error" className="text-sm text-destructive mt-1">
      {error}
    </p>
  )}
</div>
```

### Alert/Badge Component
```jsx
// Success Badge
<div className="inline-flex items-center gap-2 bg-green-100 text-green-800 
  px-3 py-1 rounded-full text-xs font-medium">
  ✓ Success
</div>

// Error Badge
<div className="inline-flex items-center gap-2 bg-red-100 text-red-800 
  px-3 py-1 rounded-full text-xs font-medium">
  ✕ Error
</div>

// Warning Badge
<div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 
  px-3 py-1 rounded-full text-xs font-medium">
  ⚠ Warning
</div>

// Info Badge
<div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 
  px-3 py-1 rounded-full text-xs font-medium">
  ℹ Info
</div>
```

---

## 🎨 Semantic Token Reference

```
TEXT COLORS
───────────
text-foreground           → Primary text (max contrast for body)
text-muted-foreground    → Secondary text (lower contrast for hints/labels)

BACKGROUND COLORS
──────────────────
bg-background            → Primary bg (page/container bg)
bg-card                  → Card/surface bg
bg-muted                 → Muted surface (hover states, secondary bg)

BORDER COLORS
─────────────
border-border            → Default borders
border-destructive       → Error/danger borders

ACTION COLORS
─────────────
bg-primary               → Primary action buttons
bg-secondary             → Secondary action buttons
bg-destructive           → Dangerous actions (delete, etc.)

INTERACTIVE STATES
──────────────────
ring-ring                → Focus ring color
ring-offset-2            → Focus ring offset
hover:opacity-90         → Hover state (reduce opacity)
disabled:opacity-50      → Disabled state
```

---

## 🚀 How to Use This Skill

### Step 1: Copy This Entire Document
```
Select all text → Copy → Paste into your skill management system
```

### Step 2: Save as Markdown File
```
esparex-ui-ux-skill.md
```

### Step 3: Share with Your Team
```
→ Send in Slack
→ Add to Design System Confluence/Wiki
→ Reference in code review PRs
```

### Step 4: Use When Building Components
```
"I need to make a button"
→ Check Quick Decision Tree (section 2️⃣)
→ Copy Button component example
→ Adjust for your use case
→ Use A11y Checklist before submitting PR
→ Done!
```

### Step 5: Reference in Code Review
```
Reviewer: "This button doesn't have semantic tokens"
→ Link to: "Non-Negotiable Core Laws → Rule #1"
→ Show example code from section
→ Developer fixes immediately
```

---

## 📊 Implementation Roadmap

### Week 1: Foundation
- [ ] Install @esparex/design-tokens
- [ ] Set up Geist font globally
- [ ] Configure CSS variables for tokens
- [ ] Add ESLint rules (no arbitrary colors)

### Week 2: Conversion
- [ ] Convert existing colors to semantic tokens
- [ ] Update all buttons to use new examples
- [ ] Add focus rings to all interactive elements
- [ ] Test with axe DevTools

### Week 3: Compliance
- [ ] Run accessibility audit on all pages
- [ ] Fix WCAG 2.2 AA violations
- [ ] Update form inputs with proper labels
- [ ] Test keyboard navigation

### Week 4: Documentation
- [ ] Create Storybook stories for each component
- [ ] Document variants (button sizes, states)
- [ ] Add visual regression tests
- [ ] Train team on skill usage

---

## ✅ Verification Checklist (Quality Assurance)

Before considering component "done", verify:

```
CODE QUALITY
☐ No arbitrary colors (bg-[#123456])
☐ No arbitrary spacing (p-[17px])
☐ Uses semantic tokens (bg-background, etc.)
☐ Uses Geist font only
☐ Single responsive component (no Mobile*/Desktop* pairs)
☐ Uses popupBus for notifications (no Sonner)

ACCESSIBILITY
☐ WCAG 2.2 AA compliance
☐ 4.5:1 text contrast minimum
☐ 44×44px touch targets
☐ Focus ring visible
☐ Keyboard navigation works
☐ Screen reader compatible
☐ Proper ARIA labels

TESTING
☐ Tested on mobile/tablet/desktop
☐ Tested in light AND dark mode
☐ Tested with keyboard only (no mouse)
☐ axe DevTools shows 0 errors
☐ Tested with screen reader
☐ All interactive states tested (hover, focus, disabled, loading)

DOCUMENTATION
☐ Component has JSDoc comments
☐ Props documented
☐ Accessibility notes included
☐ Usage examples provided
```

---

## 🎓 Training Resources

**For New Team Members:**
1. Read: Non-Negotiable Core Laws (5 min)
2. Read: Quick Decision Tree (10 min)
3. Code: Build a simple button (15 min)
4. Check: Run A11y Checklist (5 min)
5. Test: axe DevTools scan (5 min)

**Total onboarding time: 40 minutes**

---

## 📞 Support & Questions

```
Q: "Can I use Inter font instead of Geist?"
A: No. Rule #3 is non-negotiable. Geist is SSOT.

Q: "Can I use a different toast library?"
A: No. Rule #5 is mandatory. Use popupBus only.

Q: "Can I create a separate MobileNav component?"
A: No. Rule #4 requires single responsive instance.

Q: "What if axe DevTools shows errors?"
A: Component must be fixed before merge. No exceptions.

Q: "Can I use arbitrary colors for one-off cases?"
A: No. Rule #2 is absolute. Use semantic tokens always.

Q: "How do I handle brand color changes?"
A: Update ONE token in @esparex/design-tokens. Everything updates automatically.

Q: "Is accessibility required?"
A: Yes. Rule #6 is mandatory. WCAG 2.2 AA minimum.
```

---

## 🏆 Success Metrics

You'll know this skill is working when:

```
✓ All new components use semantic tokens (0 arbitrary colors)
✓ No code reviews blocked on accessibility issues
✓ New developers productive on day 1
✓ Brand changes take <1 hour (not 50+ hours)
✓ 0 design-related bugs make it to production
✓ axe DevTools shows 0 errors on all pages
✓ Dark mode works everywhere automatically
✓ Team satisfaction with design system: >85%
```

---

## 📝 Version History

```
v1.0.0 (Original)    → Governance + 12 reference guides
v2.0.0 (This)        → Added examples, checklists, decision tree, training
                        P0 recommendations implemented
                        Ready for production use
```

---

**Last Updated:** 2026-09-21  
**Status:** ✅ Production Ready  
**Quality Score:** 9/10  
**Maturity Level:** Mature, battle-tested

---

**End of Skill Document**
