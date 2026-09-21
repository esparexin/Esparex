# 📖 HOW TO USE THE ESPAREX UI/UX SKILL - Complete Guide

This guide walks you through exactly how to use the skill after you paste it into your system.

---

## 📥 Step 1: Copy & Paste the Skill

### 1.1 Get the Skill File
```
Open: esparex-ui-ux-complete-skill.md
```

### 1.2 Copy All Content
```
Select All (Ctrl+A / Cmd+A)
Copy (Ctrl+C / Cmd+C)
```

### 1.3 Paste into Your System

**If using Claude Skills Manager:**
```
1. Go to: Settings > Skills > Import Skill
2. Paste content
3. Click: Save / Add Skill
4. Name: esparex-ui-ux
```

**If using GitHub:**
```
1. Create: skills/esparex-ui-ux-skill.md
2. Paste content
3. Commit & Push
4. Reference in project documentation
```

**If using Confluence/Wiki:**
```
1. Create new page: Design System > Esparex UI/UX Skill
2. Paste content in markdown format
3. Publish
4. Add to sidebar for easy access
```

---

## 🎯 Step 2: Share with Your Team

### 2.1 Send Link to Team
```
"Check out our design system skill:
 esparex-ui-ux-skill.md
 
 Use this when building components!"
```

### 2.2 Add to Code Review Template
```
In your GitHub PR template, add:

---

## Design System Checklist
- [ ] Used semantic tokens (not arbitrary colors)?
- [ ] Used Geist font only?
- [ ] Single responsive component (no Mobile/Desktop variants)?
- [ ] Passed A11y checklist?
- [ ] Ran axe DevTools?

Reference: esparex-ui-ux-skill.md
```

### 2.3 Add to Developer Onboarding
```
New developer checklist:
1. Read design system skill (40 min)
2. Build a test button using examples (20 min)
3. Run A11y checklist (5 min)
4. Ask questions in #design-system Slack
5. You're ready!
```

---

## 🔧 Step 3: Use When Building Components

### Scenario 1: "I need to make a button"

**Step 1:** Open the skill  
**Step 2:** Go to section: "Quick Decision Tree" → "1️⃣ A BUTTON"  
**Step 3:** Copy the example code:

```jsx
<button className="bg-primary text-primary-foreground 
  px-4 py-2 rounded-md border-0 hover:bg-primary/90
  focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed">
  Click Me
</button>
```

**Step 4:** Paste into your component file  
**Step 5:** Customize text/onClick handler  
**Step 6:** Done! No need to design button from scratch.

---

### Scenario 2: "I need to make a form input"

**Step 1:** Open the skill  
**Step 2:** Go to: "📋 Component Examples" → "Form Input Component"  
**Step 3:** Copy the input example  
**Step 4:** Paste into your component  
**Step 5:** Adjust ID, label, placeholder for your use case  
**Step 6:** Done!

```jsx
// BEFORE (your code):
<input type="email" placeholder="Email" />

// AFTER (using skill):
<div className="w-full">
  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
    Email Address
  </label>
  <input
    id="email"
    type="email"
    placeholder="you@example.com"
    className="w-full px-3 py-2 rounded-md border border-border bg-background 
      text-foreground placeholder:text-muted-foreground
      focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed"
  />
</div>
```

---

### Scenario 3: "My button doesn't work on mobile"

**Problem:** Button looks big on desktop, small on mobile.

**Solution:**
1. Open skill
2. Go to: "Non-Negotiable Core Laws" → "Rule #4: Single-Instance Responsive Architecture"
3. See the responsive example
4. Update your button:

```jsx
// BEFORE (broken on mobile):
<button className="px-4 py-2">Button</button>

// AFTER (works everywhere):
<button className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4">
  Button
</button>
```

Done! Button scales on all devices.

---

### Scenario 4: "Code review says I need better accessibility"

**Step 1:** Open skill  
**Step 2:** Go to: "✅ A11y Compliance Checklist"  
**Step 3:** Go through each checkbox  
**Step 4:** Fix any ✗ items  
**Step 5:** Run axe DevTools to verify  
**Step 6:** Resubmit PR

Example fixes:
```jsx
// ❌ NOT ACCESSIBLE:
<div onClick={handleClick} className="cursor-pointer">
  Click me
</div>

// ✓ ACCESSIBLE:
<button 
  onClick={handleClick}
  className="bg-primary text-primary-foreground px-4 py-2 
    focus-visible:ring-2 focus-visible:ring-ring"
>
  Click me
</button>
```

---

## 🎓 Step 4: Onboarding New Developers

### Quick Onboarding (40 minutes)

**New Developer Instructions:**

```
Welcome to the team! Here's how to build components correctly:

⏱️ TIME: 40 minutes

STEP 1: Read the Skill (15 min)
────────────────────────────
→ Open: esparex-ui-ux-skill.md
→ Read: "🚨 Non-Negotiable Core Laws" (all 6 rules)
→ Read: "🎯 Quick Decision Tree" (pick 3 examples you like)

STEP 2: Build a Practice Button (15 min)
─────────────────────────────────────────
→ Create: components/PracticeButton.tsx
→ Copy button example from Decision Tree
→ Add your own text/onClick
→ Paste into your app
→ Test: Does it look good? Does it work on mobile?

STEP 3: Check Accessibility (5 min)
────────────────────────────────────
→ Open: esparex-ui-ux-skill.md
→ Go to: "✅ A11y Compliance Checklist"
→ Check 5 items on your button:
   ☐ Has focus ring? (press Tab)
   ☐ Works with keyboard? (press Enter)
   ☐ Text color readable? (check contrast)
   ☐ Touch target big enough? (44x44px)
   ☐ Screen reader friendly? (has aria labels if needed)

STEP 4: Verify with Tools (5 min)
─────────────────────────────────
→ Install: axe DevTools Chrome extension
→ Right-click your button → "Scan page with axe"
→ Should show 0 errors ✓
→ If errors: Read error message, fix, scan again

DONE! You're ready to build real components.

Questions? Ask in #design-system Slack
────────────────────────────────────────
"I don't understand [rule]" → Someone will explain
"How do I [thing]?" → We'll show you
```

---

## 📋 Step 5: Use in Code Reviews

### As a Reviewer

When you see a component that doesn't follow the skill:

```
🔴 CODE REVIEW COMMENT:

"This button uses arbitrary color and no focus ring.

Please update to match design system:
→ Use semantic tokens (bg-primary, not bg-[#0066ff])
→ Add focus ring (focus-visible:ring-2 focus-visible:ring-ring)

Reference: esparex-ui-ux-skill.md → Rule #1 & #6

Example:
<button className=\"bg-primary text-primary-foreground px-4 py-2 
  focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2\">
  Click
</button>"
```

### As a Developer (Receiving Review)

When reviewer says "doesn't match design system":

```
1. Don't argue or ask why
2. Open: esparex-ui-ux-skill.md
3. Find the rule they're referencing
4. Copy the example code
5. Fix your component
6. Push update
7. Comment: "Fixed! Used example from [section]"
8. PR approved ✓
```

---

## 🚀 Step 6: Use in Different Scenarios

### Scenario A: Building a New Feature

```
1. Plan your UI on paper / Figma
2. For each component:
   → Open skill
   → Find in "Quick Decision Tree"
   → Copy example code
   → Adjust for your use case
3. Build entire feature using design system components
4. Use A11y Checklist before submitting
5. Done!

Time saved: 50% faster than building from scratch
```

---

### Scenario B: Fixing Design Inconsistencies

```
Problem: Buttons look different across app (different colors, sizes)

Solution:
1. Open skill → Section "📋 Component Examples"
2. Copy the official Button example
3. Find all different button implementations
4. Replace each with the official one
5. Everything matches now ✓

Time saved: Hours of manual fixes → 30 minutes
```

---

### Scenario C: New Team Member Joins

```
1. Give them: esparex-ui-ux-skill.md
2. Say: "Read this, it's how we build UIs"
3. They spend 40 min reading + practicing
4. They're now productive ✓
5. No months of "how do we do things" questions

Time saved: 4 weeks onboarding → 1 day
```

---

### Scenario D: Accessibility Audit

```
Your app has accessibility issues. Here's how to fix:

1. Get list of pages to audit
2. For each page:
   → Run axe DevTools extension
   → Fix each error using skill examples
   → Reference the error to appropriate rule
3. Re-run axe DevTools → should be all green ✓

Time saved: Systematic fixes vs random guessing
```

---

### Scenario E: Dark Mode Implementation

```
Problem: You need to add dark mode support

Solution:
1. Open skill → Rule #2 "Design Token SSOT"
2. All your code already uses semantic tokens? ✓
3. Dark mode "just works" automatically!
4. No special dark mode code needed

Time saved: Dark mode in 0 hours (it's automatic)
```

---

### Scenario F: Brand Color Change

```
Your brand color changes from blue to purple.

BEFORE (without skill):
1. Search codebase: Find 247 files with "blue"
2. Manually update each file
3. Miss some → inconsistency
4. Time: 50+ hours

AFTER (with skill):
1. Update ONE token in @esparex/design-tokens
   color.primary = "purple"
2. Entire app updates automatically
3. No manual changes needed
4. Time: 30 minutes
```

---

## ⚠️ Step 7: Common Mistakes & Fixes

### Mistake #1: Using Arbitrary Colors
```jsx
❌ WRONG:
<button className="bg-[#0066ff]">Click</button>

🔧 FIX:
<button className="bg-primary">Click</button>

📖 Reference: Skill → "Rule #1" + "Rule #2"
```

---

### Mistake #2: Creating Duplicate Mobile/Desktop Components
```jsx
❌ WRONG:
export const Nav = () => {
  if (isMobile) return <MobileNav />;
  return <DesktopNav />;
}

🔧 FIX:
export const Nav = () => (
  <nav className="flex flex-col md:flex-row">
    {/* One responsive component */}
  </nav>
)

📖 Reference: Skill → "Rule #4"
```

---

### Mistake #3: Using Sonner Toast
```jsx
❌ WRONG:
import { toast } from 'sonner';
toast.success('Saved!');

🔧 FIX:
import { popupBus } from '@esparex/popup-bus';
popupBus.notify({ type: 'success', title: 'Saved!' });

📖 Reference: Skill → "Rule #5"
```

---

### Mistake #4: No Focus Ring on Button
```jsx
❌ WRONG:
<button className="bg-primary px-4 py-2">
  Click
</button>

🔧 FIX:
<button className="bg-primary px-4 py-2 
  focus-visible:ring-2 focus-visible:ring-ring">
  Click
</button>

📖 Reference: Skill → "Rule #6" + "A11y Checklist"
```

---

### Mistake #5: Missing Label on Form Input
```jsx
❌ WRONG:
<input type="email" placeholder="Email" />

🔧 FIX:
<label htmlFor="email">Email</label>
<input id="email" type="email" />

📖 Reference: Skill → "A11y Checklist" + "Component Examples"
```

---

## 🧪 Step 8: Verification Workflow

### Before Submitting a PR

```
COMPONENT CHECKLIST (5 minutes)
═════════════════════════════════

1. CODE QUALITY CHECK (2 min)
   ☐ Uses semantic tokens?
      → Search file: "bg-[" or "text-[" → should find 0 results
   ☐ Uses Geist font only?
      → No Inter, Roboto, or custom fonts
   ☐ Single responsive component?
      → No MobileNav + DesktopNav duplicates

2. ACCESSIBILITY CHECK (2 min)
   ☐ Has focus ring?
      → Click component, press Tab, see blue ring
   ☐ Works with keyboard?
      → Unplug mouse, navigate with Tab+Enter
   ☐ Text readable?
      → Text looks good in light AND dark mode

3. TOOLS CHECK (1 min)
   ☐ Open DevTools
   ☐ Install axe DevTools if not already
   ☐ Right-click component → "Scan page with axe"
   ☐ Should show: 0 errors ✓
   ☐ If errors: Read error, fix, scan again

IF ALL CHECKS ✓: Ready to submit PR
IF ANY CHECK ✗: Fix then recheck
```

---

## 📱 Step 9: Mobile Testing Workflow

### Test Your Component on Mobile

```
1. Build component on desktop
2. Open phone / tablet simulator
3. Check each responsive class:
   ✓ Mobile (< 640px): correct size
   ✓ Tablet (640px - 1024px): correct size
   ✓ Desktop (> 1024px): correct size
4. Check touch target size:
   ✓ All clickable elements 44×44px or larger
5. Check readability:
   ✓ Text readable on small screen
   ✓ Colors have enough contrast
6. Test touch:
   ✓ Can tap buttons easily
   ✓ No accidental double-clicks
7. Done! Component works everywhere

Reference: Skill → "Rule #4" + "A11y Checklist"
```

---

## 🆘 Step 10: Getting Help

### If You're Stuck

```
PROBLEM: "I don't understand Rule #1"
SOLUTION: 
1. Open skill → "Rule #1"
2. Read the explanation
3. Copy the example code (❌ WRONG vs ✅ RIGHT)
4. Still confused? Ask in Slack

───────────────────────────────────────────────

PROBLEM: "What component should I use?"
SOLUTION:
1. Open skill → "Quick Decision Tree"
2. Find your use case (button, form, card, etc.)
3. Follow the steps
4. Copy the example
5. Done!

───────────────────────────────────────────────

PROBLEM: "axe DevTools shows an error"
SOLUTION:
1. Read the error message carefully
2. Open skill → "A11y Checklist"
3. Find the related checklist item
4. Fix that issue in your code
5. Re-run axe DevTools
6. Error should disappear

───────────────────────────────────────────────

PROBLEM: "How do I make [thing]?"
SOLUTION:
1. Open skill → "Quick Decision Tree"
2. Ctrl+F to search
3. If found: Copy example
4. If not found: Ask in #design-system Slack
   → "How do I make [thing]?"
   → Someone will point you to a component or guide

───────────────────────────────────────────────

PROBLEM: "Code review says my button is wrong"
SOLUTION:
1. Read the reviewer's comment
2. Find the rule they reference
3. Open skill → find that rule
4. Copy the correct example
5. Update your code
6. Reply: "Fixed! Updated to match [rule]"
```

---

## 📊 Success Metrics

After using this skill for 2 weeks:

```
You'll see:
✓ All new components follow design system
✓ No more "arbitrary color" comments in reviews
✓ No more accessibility issues caught in QA
✓ Code reviews finish faster (20 min vs 90 min)
✓ New developers productive on day 1
✓ Everyone knows "how we build UI"

After 1 month:
✓ Design consistency at 95%+
✓ 0 dark mode bugs
✓ All components accessible (WCAG 2.2 AA)
✓ Feature development 50% faster
✓ Team happiness about design system: high 👍
```

---

## 🎯 Quick Start (TL;DR)

**Just starting out? Follow this:**

```
1. Download: esparex-ui-ux-complete-skill.md ✓
2. Bookmark it or save locally ✓
3. Read: "🚨 Non-Negotiable Core Laws" (15 min) ✓
4. Read: "🎯 Quick Decision Tree" (10 min) ✓
5. When building component:
   → Go to Decision Tree
   → Find your component type
   → Copy example code
   → Adjust for your use case
   → Use A11y Checklist (5 min)
   → Done!

You're now using the design system correctly ✓
```

---

## 📞 Support & Resources

**Slack Channel**: #design-system  
**Documentation**: esparex-ui-ux-complete-skill.md  
**Tool**: axe DevTools (Chrome extension)  
**Font**: Geist (https://vercel.com/font)

---

**Version:** 2.0.0  
**Last Updated:** 2026-09-21  
**Status:** ✅ Ready to Use

Enjoy building beautiful, accessible UIs! 🚀
