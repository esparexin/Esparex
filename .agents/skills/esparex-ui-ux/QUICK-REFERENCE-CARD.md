# ⚡ ESPAREX UI/UX DESIGN SYSTEM - QUICK REFERENCE CARD
## Print This & Keep at Your Desk

---

## 🚨 6 CORE RULES (NEVER BREAK THESE)

| # | Rule | ❌ WRONG | ✅ RIGHT |
|---|------|---------|---------|
| 1 | Semantic Tokens | `bg-[#0066ff]` | `bg-primary` |
| 2 | Design Tokens SSOT | Hardcoded colors | Use `@esparex/design-tokens` |
| 3 | Geist Font Only | `font-inter`, `font-roboto` | `font-primary` (Geist) |
| 4 | Single Responsive | `<MobileNav />` + `<DesktopNav />` | ONE component with `md:` classes |
| 5 | Native Popup Only | `import { toast } from 'sonner'` | `import { popupBus }` |
| 6 | WCAG 2.2 AA | No focus ring, low contrast | Pass a11y checklist + axe DevTools |

---

## 🎯 QUICK DECISION TREE

**Need to build something?**

```
BUTTON?
  → Copy from "Button Component (All Variants)"
  → Add: focus-visible:ring-2 ring-ring ring-offset-2
  
FORM INPUT?
  → Copy from "Form Input Component"
  → Remember: <label htmlFor="id"> + <input id="id">
  
CARD?
  → Use: rounded-lg border border-border bg-card p-4 md:p-6
  
DIALOG/MODAL?
  → Use Dialog from @esparex/ui OR copy example
  → Handle Escape key to close
  
POPUP/TOAST?
  → Use: import { popupBus }
  → Call: popupBus.notify({ type, title, message })
  
TABLE?
  → Use: <thead>, <tbody>, <th>, proper semantics
  
MOBILE + DESKTOP?
  → ONE component with grid-cols-1 md:grid-cols-2 lg:grid-cols-3
  
SHOW/HIDE BY SCREEN?
  → hidden md:flex (hide on mobile, show on tablet+)
  → md:hidden lg:block (hide md, show lg+)
```

---

## 🎨 SEMANTIC TOKENS (USE THESE)

### Text Colors
```
text-foreground           ← Main text (high contrast)
text-muted-foreground    ← Secondary text (lower contrast)
text-destructive         ← Error/danger text
```

### Background Colors
```
bg-background    ← Page/container background
bg-card          ← Card surface
bg-muted         ← Hover states, secondary surfaces
```

### Border Colors
```
border-border         ← Normal borders
border-destructive    ← Error borders
```

### Action Colors
```
bg-primary              ← Primary action (main button)
text-primary-foreground ← Text on primary background
bg-secondary            ← Secondary action
bg-destructive          ← Dangerous actions (delete, etc.)
```

### Interactive
```
focus-visible:ring-2            ← Focus indicator
focus-visible:ring-ring         ← Ring color
focus-visible:ring-offset-2     ← Ring spacing
hover:bg-primary/90             ← Hover state
disabled:opacity-50             ← Disabled state
```

---

## 🔥 COPY-PASTE COMPONENTS

### Button (Primary)
```jsx
<button className="bg-primary text-primary-foreground px-4 py-2 rounded-md 
  hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring 
  focus-visible:ring-offset-2 disabled:opacity-50">
  Click Me
</button>
```

### Button (Outline)
```jsx
<button className="bg-background text-foreground border border-border px-4 py-2 
  rounded-md hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring 
  focus-visible:ring-offset-2 disabled:opacity-50">
  Click Me
</button>
```

### Form Input
```jsx
<div className="w-full">
  <label htmlFor="email" className="block text-body font-medium mb-2">
    Email
  </label>
  <input
    id="email"
    type="email"
    className="w-full text-body-lg md:text-body px-3 py-2 rounded-md border border-border 
      bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring 
      disabled:opacity-50"
  />
</div>
```

### Card
```jsx
<div className="rounded-lg border border-border bg-card p-4 md:p-6 shadow-sm">
  <h3 className="text-h4 font-semibold text-foreground">Title</h3>
  <p className="text-body text-muted-foreground">Description</p>
</div>
```

### Toast/Notification
```jsx
import { popupBus } from '@esparex/popup-bus';

popupBus.notify({
  type: 'success',
  title: 'Success!',
  message: 'Action completed',
  duration: 3000
});
```

### Responsive Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id}>{item.name}</Card>
  ))}
</div>
```

### Responsive Navigation
```jsx
<nav className="flex flex-col md:flex-row gap-2">
  <button className="md:hidden">Menu</button>
  <div className="hidden md:flex gap-4">
    <a href="#home">Home</a>
    <a href="#about">About</a>
  </div>
</nav>
```

---

## ✅ 5-MINUTE A11Y CHECK

**Before submitting your component:**

- [ ] **Tab through it** - Can you focus all buttons with Tab? YES ✓
- [ ] **See focus ring** - Do you see blue ring when focused? YES ✓
- [ ] **Press Enter** - Does button work with keyboard? YES ✓
- [ ] **Dark mode** - Text readable in dark mode? YES ✓
- [ ] **Run axe** - Open axe DevTools, scan, 0 errors? YES ✓

**If all ✓:** Ready to submit!  
**If any ✗:** Fix then recheck!

---

## 🧪 TESTING CHECKLIST (2 MINUTES)

```
RESPONSIVE
☐ Looks good on mobile (< 640px)
☐ Looks good on tablet (640-1024px)
☐ Looks good on desktop (> 1024px)

TOUCH
☐ All buttons are 44×44px or larger
☐ Enough space between clickable elements

CONTRAST
☐ Text is readable in light mode
☐ Text is readable in dark mode

KEYBOARD
☐ Tab navigates all elements
☐ Enter/Space activates buttons
☐ Escape closes modals

SCREEN READER
☐ Buttons have labels
☐ Forms have labels
☐ Icons have aria-label
```

---

## ❌ ANTI-PATTERNS (DON'T DO THIS)

| ❌ WRONG | ✅ RIGHT | REFERENCE |
|---------|---------|-----------|
| `bg-[#0066ff]` | `bg-primary` | Rule #1 |
| `p-[17px]` | `px-4 py-2` | Rule #2 |
| `font-inter` | `font-primary` | Rule #3 |
| `<MobileNav>` + `<DesktopNav>` | ONE component + `md:` classes | Rule #4 |
| `import { toast } from 'sonner'` | `import { popupBus }` | Rule #5 |
| No focus ring | `focus-visible:ring-2 ring-ring` | Rule #6 |
| `<div onClick>` | `<button>` | Semantics |
| No label on input | `<label htmlFor="id"> + <input id>` | A11y |

---

## 🎯 RESPONSIVE BREAKPOINTS

```
Mobile:      < 640px   (sm)
Tablet:      640px+    (md)
Laptop:      1024px+   (lg)
Desktop:     1280px+   (xl)
4K:          1536px+   (2xl)

EXAMPLES:
hidden md:flex         ← Hide on mobile, show on tablet+
grid-cols-1 md:grid-cols-2  ← 1 column mobile, 2 on tablet+
text-body md:text-body-lg   ← Body text on mobile, lead text on tablet+
```

---

## 📦 COMMON IMPORTS

```javascript
// Tokens
import { colors, spacing } from '@esparex/design-tokens';

// UI Components
import { Button, Card, Dialog, Input } from '@esparex/ui';

// Notifications
import { popupBus } from '@esparex/popup-bus';

// Testing
// Install: npm install --save-dev @axe-core/react
```

---

## 🔧 TOOLS YOU NEED

1. **axe DevTools** (Chrome extension)
   - Right-click > "Scan page with axe"
   - Shows all a11y issues
   - Should show 0 errors

2. **Chrome DevTools** (Built-in)
   - F12 to open
   - Inspect element to check sizes
   - Toggle device toolbar for mobile testing

3. **VoiceOver / NVDA**
   - Screen reader testing
   - Mac: Cmd+F5
   - Windows: Free NVDA

---

## 💬 HOW TO REFERENCE IN CODE REVIEW

**Instead of:** "This doesn't look right"  
**Say:** "Please update to match design system Rule #1 - use `bg-primary` instead of `bg-[#0066ff]`. See esparex-ui-ux-skill.md for example."

**Instead of:** "Add a focus ring"  
**Say:** "Add focus-visible ring for a11y. Reference: A11y Checklist section."

---

## 🎓 STILL LEARNING?

1. Read the full skill: `esparex-ui-ux-complete-skill.md`
2. Watch teammates code
3. Ask in `#design-system` Slack
4. Copy examples and adapt

---

## ⚡ SPEED TRICKS

**Build a button in 30 seconds:**
1. Copy from COPY-PASTE COMPONENTS section
2. Change text
3. Done!

**Build a form in 1 minute:**
1. Copy input component
2. Duplicate for each field
3. Adjust labels/types
4. Done!

**Build a card in 15 seconds:**
1. Copy Card template
2. Add content
3. Done!

**Check accessibility in 2 minutes:**
1. Use 5-MINUTE A11Y CHECK
2. Run axe DevTools
3. Done!

---

## 📞 QUICK HELP

| Problem | Solution |
|---------|----------|
| "What tokens should I use?" | See SEMANTIC TOKENS table above |
| "How do I make X?" | See QUICK DECISION TREE |
| "Is my component accessible?" | Run 5-MINUTE A11Y CHECK |
| "Code review says something's wrong" | Search this card for the rule, copy the example |
| "Still confused?" | Read `esparex-ui-ux-complete-skill.md` or ask #design-system |

---

## 🏆 GOLDEN RULE

```
When in doubt:
1. Copy from this card or the full skill
2. Run axe DevTools (right-click > scan)
3. If 0 errors → you're good ✓
4. If errors → read error message, fix, scan again
```

---

**Print this card and keep it at your desk!**

Last Updated: 2026-09-21  
Version: 2.0.0
