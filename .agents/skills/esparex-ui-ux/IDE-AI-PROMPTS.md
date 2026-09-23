# 🤖 AI IDE PROMPTS - Use in VS Code / IDE with AI Assistant

**Copy & paste these prompts into your AI assistant in your IDE (Claude in VS Code, etc.)**

---

## 📌 BEFORE USING THESE PROMPTS

Make sure you have:
- ✅ Uploaded `esparex-ui-ux-complete-skill.md` to your IDE
- ✅ Uploaded `HOW-TO-USE-THIS-SKILL.md` to your IDE  
- ✅ Uploaded `QUICK-REFERENCE-CARD.md` to your IDE
- ✅ Reference the files when using prompts below

**IDE Setup:**
- **VS Code**: Use Claude extension → attach files → paste prompt
- **GitHub Copilot**: Use prompt in chat → reference files
- **Any AI IDE**: Attach files → paste prompt → send

---

## 🎯 PROMPT #1: Build a Component (Most Common)

```
Based on the attached design system files, build a [COMPONENT_TYPE] component.

Requirements:
- Follow all 6 core rules from the skill
- Use semantic tokens (not arbitrary colors)
- Include proper accessibility (WCAG 2.2 AA)
- Add focus ring for keyboard navigation
- Use Geist font only
- Match the example from the Quick Reference Card if available

Component type: [COMPONENT_TYPE]
Use case: [DESCRIBE_YOUR_USE_CASE]
Props needed: [LIST_YOUR_PROPS]

Return:
1. Complete TSX/JSX component
2. Inline comments explaining design system choices
3. List of semantic tokens used
4. A11y features included
```

**Examples to fill in:**
```
Prompt: Based on the attached design system files, build a BUTTON component.

Requirements:
- Follow all 6 core rules from the skill
- Use semantic tokens (not arbitrary colors)
- Include proper accessibility (WCAG 2.2 AA)
- Add focus ring for keyboard navigation
- Use Geist font only
- Match the example from the Quick Reference Card if available

Component type: Primary Action Button
Use case: Submit form with loading state
Props needed: onClick, loading, disabled, children

Return:
1. Complete TSX/JSX component
2. Inline comments explaining design system choices
3. List of semantic tokens used
4. A11y features included
```

---

## 🎨 PROMPT #2: Check My Component Against Design System

```
I've written this component code. Please review it against the attached design system files.

Check for:
1. Rule #1: Does it use semantic tokens (not arbitrary colors)?
2. Rule #2: Does it use @esparex/design-tokens?
3. Rule #3: Does it use Geist font only?
4. Rule #4: Is it a single responsive component (not Mobile/Desktop variants)?
5. Rule #5: Does it use popupBus (if notifications)?
6. Rule #6: Does it pass WCAG 2.2 AA accessibility?

My code:
[PASTE_YOUR_CODE_HERE]

Return:
1. Pass/Fail for each rule
2. Specific issues found
3. Code suggestions to fix
4. Reference to the skill section for each issue
```

**Example:**
```
I've written this component code. Please review it against the attached design system files.

Check for:
1. Rule #1: Does it use semantic tokens (not arbitrary colors)?
2. Rule #2: Does it use @esparex/design-tokens?
3. Rule #3: Does it use Geist font only?
4. Rule #4: Is it a single responsive component (not Mobile/Desktop variants)?
5. Rule #5: Does it use popupBus (if notifications)?
6. Rule #6: Does it pass WCAG 2.2 AA accessibility?

My code:
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Click Me
</button>

Return:
1. Pass/Fail for each rule
2. Specific issues found
3. Code suggestions to fix
4. Reference to the skill section for each issue
```

---

## ♿ PROMPT #3: Make My Component Accessible

```
Based on the attached design system files (especially the A11y Checklist), 
make this component WCAG 2.2 AA compliant.

My current component:
[PASTE_YOUR_CODE_HERE]

Use:
- The A11y Compliance Checklist from the complete skill file
- The focus ring examples
- Semantic HTML
- Proper ARIA labels
- Touch target sizes (44×44px minimum)

Return:
1. Updated component with all a11y fixes
2. Explanation of each a11y feature added
3. How to test it with axe DevTools
4. List of a11y checklist items that pass
```

**Example:**
```
Based on the attached design system files (especially the A11y Checklist), 
make this component WCAG 2.2 AA compliant.

My current component:
<input type="email" placeholder="Enter email" />

<button onClick={handleSubmit}>
  Submit
</button>

Use:
- The A11y Compliance Checklist from the complete skill file
- The focus ring examples
- Semantic HTML
- Proper ARIA labels
- Touch target sizes (44×44px minimum)

Return:
1. Updated component with all a11y fixes
2. Explanation of each a11y feature added
3. How to test it with axe DevTools
4. List of a11y checklist items that pass
```

---

## 📱 PROMPT #4: Make It Responsive (Mobile + Desktop)

```
Using the attached design system files, make this component responsive 
for mobile, tablet, and desktop.

Current component:
[PASTE_YOUR_CODE_HERE]

Reference:
- Rule #4: Single-Instance Responsive Architecture
- Quick Reference Card: RESPONSIVE BREAKPOINTS section
- Decision Tree: "MOBILE + DESKTOP?" example

Requirements:
- ONE component (not separate Mobile/Desktop)
- Mobile first: < 640px (looks good)
- Tablet: 640px - 1024px (optimized)
- Desktop: > 1024px (full featured)
- Use md: and lg: responsive classes

Return:
1. Updated responsive component
2. Explain responsive breakpoints used
3. Show what changes at each breakpoint
4. Visual description of how it looks on each screen
```

**Example:**
```
Using the attached design system files, make this component responsive 
for mobile, tablet, and desktop.

Current component:
<div>
  <h1>Welcome</h1>
  <p>Description</p>
  <button>Get Started</button>
</div>

Reference:
- Rule #4: Single-Instance Responsive Architecture
- Quick Reference Card: RESPONSIVE BREAKPOINTS section
- Decision Tree: "MOBILE + DESKTOP?" example

Requirements:
- ONE component (not separate Mobile/Desktop)
- Mobile first: < 640px (looks good)
- Tablet: 640px - 1024px (optimized)
- Desktop: > 1024px (full featured)
- Use md: and lg: responsive classes

Return:
1. Updated responsive component
2. Explain responsive breakpoints used
3. Show what changes at each breakpoint
4. Visual description of how it looks on each screen
```

---

## 🎯 PROMPT #5: Copy-Paste Ready Component

```
Using the attached Quick Reference Card, give me a ready-to-use copy-paste 
component for a [COMPONENT_TYPE].

I need:
- [DESCRIBE_SPECIFIC_NEEDS]

Use the Quick Reference Card section "COPY-PASTE COMPONENTS" and adapt it for:
- [YOUR_USE_CASE]

Return:
1. Complete copy-paste ready code
2. Exactly matches design system
3. Includes all a11y features
4. Ready to paste into file and use immediately
5. Example of how to customize props
```

**Example:**
```
Using the attached Quick Reference Card, give me a ready-to-use copy-paste 
component for a FORM INPUT.

I need:
- Email input with error state
- Label connected to input
- Error message displayed below
- Proper accessibility labels

Use the Quick Reference Card section "COPY-PASTE COMPONENTS" and adapt it for:
- E-commerce signup form

Return:
1. Complete copy-paste ready code
2. Exactly matches design system
3. Includes all a11y features
4. Ready to paste into file and use immediately
5. Example of how to customize props
```

---

## 🐛 PROMPT #6: Fix Accessibility Issues

```
I ran axe DevTools and got these accessibility errors. 
Using the attached skill files, fix them.

My component:
[PASTE_YOUR_CODE_HERE]

Errors from axe DevTools:
[PASTE_ERROR_LIST_HERE]

Reference the attached files:
- A11y Compliance Checklist (for fixes)
- Anti-patterns section (for what NOT to do)
- Component examples (for correct patterns)

Return:
1. Fixed component code
2. Explanation of each fix
3. Why each error was happening
4. How to prevent this type of error in future
5. axe DevTools testing steps to verify fix
```

**Example:**
```
I ran axe DevTools and got these accessibility errors. 
Using the attached skill files, fix them.

My component:
<button onClick={handleClick}>
  ✕
</button>

Errors from axe DevTools:
- "Buttons must have discernible text"
- "Focus indicator not visible"

Reference the attached files:
- A11y Compliance Checklist (for fixes)
- Anti-patterns section (for what NOT to do)
- Component examples (for correct patterns)

Return:
1. Fixed component code
2. Explanation of each fix
3. Why each error was happening
4. How to prevent this type of error in future
5. axe DevTools testing steps to verify fix
```

---

## 🎨 PROMPT #7: Convert to Semantic Tokens

```
I'm using arbitrary colors in this component. 
Convert it to semantic tokens using the attached design system.

Current component with arbitrary colors:
[PASTE_YOUR_CODE_HERE]

Reference:
- Rule #1 and Rule #2 in the skill file
- SEMANTIC TOKENS section in Quick Reference Card
- Anti-patterns: "Arbitrary Colors" example

Convert all:
- Hardcoded hex colors (#123456) → semantic tokens
- Arbitrary spacing (p-[17px]) → proper grid (px-4, py-3)
- Arbitrary radius (rounded-[13px]) → design tokens (rounded-md)

Return:
1. Updated component with only semantic tokens
2. List of tokens used and what they mean
3. How this supports dark mode automatically
4. How this makes brand updates easier
```

**Example:**
```
I'm using arbitrary colors in this component. 
Convert it to semantic tokens using the attached design system.

Current component with arbitrary colors:
<div className="bg-[#f5f5f5] text-[#333333] p-[17px] rounded-[13px] border border-[#e0e0e0]">
  <h3 className="font-inter text-[24px]">Title</h3>
  <p className="text-[14px]">Description</p>
</div>

Reference:
- Rule #1 and Rule #2 in the skill file
- SEMANTIC TOKENS section in Quick Reference Card
- Anti-patterns: "Arbitrary Colors" example

Convert all:
- Hardcoded hex colors (#123456) → semantic tokens
- Arbitrary spacing (p-[17px]) → proper grid (px-4, py-3)
- Arbitrary radius (rounded-[13px]) → design tokens (rounded-md)

Return:
1. Updated component with only semantic tokens
2. List of tokens used and what they mean
3. How this supports dark mode automatically
4. How this makes brand updates easier
```

---

## 📊 PROMPT #8: Create Component Variants

```
Using the attached design system, create multiple variants of a [COMPONENT] component.

Base component:
[PASTE_YOUR_BASE_COMPONENT_HERE]

Variants needed:
- [VARIANT_1]
- [VARIANT_2]
- [VARIANT_3]

Reference:
- Button component examples from the Complete Skill file
- "Component Examples" section
- Interaction states section

Return:
1. Code for each variant
2. When to use each variant
3. Props to differentiate them
4. Example usage for each
5. All follow design system rules
```

**Example:**
```
Using the attached design system, create multiple variants of a BUTTON component.

Base component:
<button className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
  Click
</button>

Variants needed:
- Primary (main action)
- Secondary (alternate action)
- Outline (subtle action)
- Destructive (dangerous action)
- Disabled state
- Loading state

Reference:
- Button component examples from the Complete Skill file
- "Component Examples" section
- Interaction states section

Return:
1. Code for each variant
2. When to use each variant
3. Props to differentiate them
4. Example usage for each
5. All follow design system rules
```

---

## 🔄 PROMPT #9: Dark Mode Support

```
Using the attached design system, add dark mode support to this component.

Current component:
[PASTE_YOUR_CODE_HERE]

Requirements:
- Use semantic tokens (they handle dark mode automatically)
- Test in light and dark modes
- Proper contrast in both modes
- Reference the skill's dark mode section

Return:
1. Component code (should just use semantic tokens)
2. Explanation that semantic tokens handle dark mode
3. How to test dark mode
4. No need for special dark mode code if using tokens
```

**Example:**
```
Using the attached design system, add dark mode support to this component.

Current component:
<div className="bg-white text-black p-4 border border-gray-300">
  <h3>Title</h3>
  <p>Description</p>
</div>

Requirements:
- Use semantic tokens (they handle dark mode automatically)
- Test in light and dark modes
- Proper contrast in both modes
- Reference the skill's dark mode section

Return:
1. Component code (should just use semantic tokens)
2. Explanation that semantic tokens handle dark mode
3. How to test dark mode
4. No need for special dark mode code if using tokens
```

---

## 📋 PROMPT #10: Review for Design System Compliance

```
Complete design system compliance check. Analyze this component against 
ALL rules in the attached skill file.

Component to review:
[PASTE_YOUR_CODE_HERE]

Use the attached files to check:
1. Rule #1: Semantic tokens (not arbitrary colors)?
2. Rule #2: Design tokens SSOT used?
3. Rule #3: Geist font only?
4. Rule #4: Single responsive component?
5. Rule #5: popupBus for notifications?
6. Rule #6: WCAG 2.2 AA compliant?
7. Responsive breakpoints correct?
8. Touch targets 44×44px minimum?
9. Focus rings visible?
10. Semantic HTML used?

Return:
1. Compliance report (Pass/Fail for each)
2. Issues found with code locations
3. Specific fixes needed
4. Priority (Critical/High/Medium/Low)
5. Links to relevant skill sections
6. Summary: "Ready for code review" or "Needs fixes"
```

**Example:**
```
Complete design system compliance check. Analyze this component against 
ALL rules in the attached skill file.

Component to review:
const MyButton = ({ onClick, children }) => (
  <div 
    onClick={onClick}
    className="bg-[#0066ff] text-white cursor-pointer px-4 py-2 rounded"
  >
    {children}
  </div>
);

Use the attached files to check:
1. Rule #1: Semantic tokens (not arbitrary colors)?
2. Rule #2: Design tokens SSOT used?
3. Rule #3: Geist font only?
4. Rule #4: Single responsive component?
5. Rule #5: popupBus for notifications?
6. Rule #6: WCAG 2.2 AA compliant?
7. Responsive breakpoints correct?
8. Touch targets 44×44px minimum?
9. Focus rings visible?
10. Semantic HTML used?

Return:
1. Compliance report (Pass/Fail for each)
2. Issues found with code locations
3. Specific fixes needed
4. Priority (Critical/High/Medium/Low)
5. Links to relevant skill sections
6. Summary: "Ready for code review" or "Needs fixes"
```

---

## 🧪 PROMPT #11: Generate Test Code

```
Using the attached design system, generate test/storybook code for this component.

Component:
[PASTE_YOUR_COMPONENT_HERE]

Generate:
1. Storybook stories for each variant
2. All interaction states (default, hover, focus, disabled, loading)
3. Responsive preview (mobile, tablet, desktop)
4. Accessibility testing setup
5. Dark mode story

Reference:
- Component examples from the skill
- All interaction states section
```

**Example:**
```
Using the attached design system, generate test/storybook code for this component.

Component:
const Button = ({ children, variant = 'primary', disabled, loading }) => (
  <button 
    disabled={disabled}
    className={`px-4 py-2 rounded-md focus-visible:ring-2 focus-visible:ring-ring 
      ${variant === 'primary' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {loading && <span>Loading...</span>}
    {!loading && children}
  </button>
);

Generate:
1. Storybook stories for each variant
2. All interaction states (default, hover, focus, disabled, loading)
3. Responsive preview (mobile, tablet, desktop)
4. Accessibility testing setup
5. Dark mode story

Reference:
- Component examples from the skill
- All interaction states section
```

---

## 🎓 PROMPT #12: Teach Me This Rule

```
I don't understand [RULE_NUMBER] from the design system.

Using the attached skill files, explain:
1. What is the rule?
2. Why does it matter?
3. Show ❌ WRONG and ✅ RIGHT examples
4. When should I use this?
5. How do I verify I'm following it?

Return:
- Clear explanation (for someone new to design systems)
- 3 different code examples
- Real-world impact
- Reference exact section from the skill
```

**Example:**
```
I don't understand Rule #4 (Single-Instance Responsive Architecture) 
from the design system.

Using the attached skill files, explain:
1. What is the rule?
2. Why does it matter?
3. Show ❌ WRONG and ✅ RIGHT examples
4. When should I use this?
5. How do I verify I'm following it?

Return:
- Clear explanation (for someone new to design systems)
- 3 different code examples
- Real-world impact
- Reference exact section from the skill
```

---

## 🚀 PROMPT #13: Implement Quick Reference Card

```
I'm reading the Quick Reference Card from the attached files.

For the [COMPONENT_TYPE] component in the "COPY-PASTE COMPONENTS" section,
show me:
1. The exact code to copy
2. How to customize it for my use case
3. Which semantic tokens are used
4. How to test it
5. Common mistakes to avoid

My use case: [DESCRIBE_YOUR_USE_CASE]

Return:
1. Copy-paste ready code
2. Customization guide
3. Testing checklist
4. Anti-patterns to watch for
```

**Example:**
```
I'm reading the Quick Reference Card from the attached files.

For the FORM INPUT component in the "COPY-PASTE COMPONENTS" section,
show me:
1. The exact code to copy
2. How to customize it for my use case
3. Which semantic tokens are used
4. How to test it
5. Common mistakes to avoid

My use case: User registration form with email, password, confirm password fields

Return:
1. Copy-paste ready code
2. Customization guide
3. Testing checklist
4. Anti-patterns to watch for
```

---

## 💾 PROMPT #14: Quick Fix for Code Review Comment

```
Code review said: "[CODE_REVIEW_COMMENT]"

Using the attached design system files, fix my component.

My current code:
[PASTE_YOUR_CODE_HERE]

The reviewer referenced: [IF_KNOWN: "Rule #X" or "Section Y"]

Return:
1. Fixed code (ready to paste)
2. Explanation of what was wrong
3. Why the fix is better
4. Reference to the skill section
```

**Example:**
```
Code review said: "This button doesn't have proper accessibility. 
Add a focus ring and make it a proper button element."

Using the attached design system files, fix my component.

My current code:
<div onClick={handleClick} className="bg-primary text-white px-4 py-2 rounded cursor-pointer">
  Submit
</div>

The reviewer referenced: Rule #6 WCAG 2.2 AA

Return:
1. Fixed code (ready to paste)
2. Explanation of what was wrong
3. Why the fix is better
4. Reference to the skill section
```

---

## 🔍 PROMPT #15: Debug Dark Mode Issues

```
Dark mode isn't working correctly in this component.

Component:
[PASTE_YOUR_CODE_HERE]

Problem:
- [DESCRIBE_THE_ISSUE]
- [COLORS_LOOK_WRONG_OR_HARD_TO_READ]

Using the attached design system:
- Check if using semantic tokens
- Verify contrast in both light and dark
- Compare to examples in the skill

Return:
1. Root cause of the issue
2. Fixed component
3. How semantic tokens fix dark mode automatically
4. Steps to test dark mode
5. Why this works
```

**Example:**
```
Dark mode isn't working correctly in this component.

Component:
<div className="bg-white text-black p-4">
  <h3>Title</h3>
  <p>Description</p>
</div>

Problem:
- Background stays white in dark mode (hard to read)
- Text stays black in dark mode (invisible on dark background)

Using the attached design system:
- Check if using semantic tokens
- Verify contrast in both light and dark
- Compare to examples in the skill

Return:
1. Root cause of the issue
2. Fixed component
3. How semantic tokens fix dark mode automatically
4. Steps to test dark mode
5. Why this works
```

---

## 📝 PROMPT #16: Generate Documentation

```
Generate component documentation for [COMPONENT_NAME] 
following the design system attached.

Component:
[PASTE_YOUR_COMPONENT_HERE]

Include:
1. What it does
2. When to use it
3. Props documentation
4. Usage examples
5. Accessibility notes
6. Design system tokens used
7. Variants available
8. Best practices
9. Common mistakes

Reference:
- The skill file structure
- Component examples section
- Anti-patterns section
```

**Example:**
```
Generate component documentation for Button 
following the design system attached.

Component:
const Button = ({ children, variant = 'primary', disabled, loading, onClick }) => {
  // component code here
}

Include:
1. What it does
2. When to use it
3. Props documentation
4. Usage examples
5. Accessibility notes
6. Design system tokens used
7. Variants available
8. Best practices
9. Common mistakes

Reference:
- The skill file structure
- Component examples section
- Anti-patterns section
```

---

## 🎯 HOW TO USE THESE PROMPTS

### Step 1: Attach Files to IDE
```
In your IDE with AI:
1. Click "Attach files" / "Upload" button
2. Select the 3 .md files:
   - esparex-ui-ux-complete-skill.md
   - HOW-TO-USE-THIS-SKILL.md
   - QUICK-REFERENCE-CARD.md
3. Click "Attach" or "Upload"
```

### Step 2: Copy a Prompt
```
1. Find a prompt above that matches your task
2. Select all the text
3. Copy (Ctrl+C)
```

### Step 3: Customize the Prompt
```
Replace [BRACKETS] with your specific info:
- [COMPONENT_TYPE] → Button, Form, Card, etc.
- [PASTE_YOUR_CODE_HERE] → Your actual code
- [DESCRIBE_YOUR_USE_CASE] → What you're building
```

### Step 4: Send to AI
```
1. Paste prompt into IDE chat
2. Make sure files are still attached ✓
3. Hit Enter/Send
4. AI will respond using your design system ✓
```

### Step 5: Use the Response
```
AI will give you:
1. Code to use
2. Explanations
3. Design system references
4. Testing steps
5. Copy directly into your project ✓
```

---

## 🎁 BONUS: Create Your Own Prompts

**Template for custom prompts:**

```
[TASK DESCRIPTION]

Using the attached design system files, [WHAT_YOU_NEED].

[YOUR_CODE_OR_DETAILS]

Reference these sections:
- [RELEVANT_SECTION_1]
- [RELEVANT_SECTION_2]
- [RELEVANT_SECTION_3]

Return:
1. [WHAT_YOU_WANT_BACK]
2. [WITH_THIS_DETAIL]
3. [AND_THIS_EXPLANATION]
```

---

## ⚡ QUICK PROMPT REFERENCE

| Need | Use Prompt |
|------|-----------|
| Build a new component | Prompt #1 |
| Review my component | Prompt #2 |
| Fix accessibility | Prompt #3 or #6 |
| Make responsive | Prompt #4 |
| Copy-paste code | Prompt #5 |
| Fix a11y errors | Prompt #6 |
| Remove arbitrary colors | Prompt #7 |
| Create variants | Prompt #8 |
| Add dark mode | Prompt #9 |
| Full compliance check | Prompt #10 |
| Generate tests | Prompt #11 |
| Understand a rule | Prompt #12 |
| Use Quick Ref Card | Prompt #13 |
| Fix code review comment | Prompt #14 |
| Debug dark mode | Prompt #15 |
| Generate docs | Prompt #16 |

---

## 🚀 WORKFLOW EXAMPLE

### Scenario: Building a Form Component

```
STEP 1: Ask AI to build it
────────────────────────
Paste Prompt #1:
"Based on the attached design system files, 
build a FORM component for user registration..."

AI returns: Complete form with all design system rules ✓

STEP 2: Paste into your project
─────────────────────────────
Copy AI's code → Paste into form.tsx ✓

STEP 3: Review against design system
──────────────────────────────────
Paste Prompt #2:
"I've written this component code. 
Please review it against the attached design system files..."

AI returns: Compliance report ✓

STEP 4: If issues found, use Prompt #14
──────────────────────────
Paste Prompt #14 for quick fix ✓

STEP 5: Test accessibility
────────────────────────
Use Prompt #6 or Prompt #11 ✓

STEP 6: Done!
─────────
Ready to commit ✓
```

---

## 💡 PRO TIPS

1. **Keep files attached** - Don't remove files between prompts
2. **Be specific** - More details = better AI response
3. **Use right prompt** - Pick the prompt closest to your task
4. **Iterate** - If response isn't perfect, ask follow-up questions
5. **Reference sections** - AI can point to specific skill sections
6. **Save responses** - Keep good responses for future reference
7. **Create shortcuts** - Save your most-used prompts in a snippet manager

---

## 🆘 IF AI DOESN'T REFERENCE THE FILES

```
Make sure:
✓ Files are attached (check upload status)
✓ You mention "attached design system files" in prompt
✓ You reference specific sections
✓ Try pasting relevant section into prompt manually

If still having issues:
- Re-attach files
- Start fresh conversation
- Use a new IDE tab with fresh file attachment
```

---

**Version:** 2.0.0  
**Updated:** 2026-09-21  
**Ready to use:** ✅

Start building with AI + design system now! 🚀
