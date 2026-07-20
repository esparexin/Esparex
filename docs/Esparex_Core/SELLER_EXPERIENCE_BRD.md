# Seller Experience — Business Requirements Document

**Program:** 2 — Product Excellence  
**Track:** A — Seller Experience (Post Ad 2.0)  
**Status:** Draft  
**Owner:** Product  
**Date:** 2026-07-20

---

## 1. Business Problem

### What problem are we solving?

Electronics resale and repair in India is fragmented across general-purpose platforms that were never designed for this category.

**The core problem:** A seller listing a phone, spare part, or repair service must fight against tools built for generic classifieds. They choose between:

| Option | Pain Point |
|--------|-----------|
| **WhatsApp** | No catalog structure, no discoverability, manual price negotiation, no trust signals. Limited to existing contacts. |
| **OLX / Quikr** | Generic flat categories ("Electronics"). No phone model hierarchy, no spare parts taxonomy. Listings buried under spam. No business profile. |
| **IndiaMART** | B2B wholesale oriented. Not built for individual sellers or repair shops. Heavy lead-gen model. No fixed pricing. |
| **Amazon / Flipkart** | Requires GST, brand authorization, FBA logistics. Excludes individual sellers, repair shops, and refurbishers. |

### The consequence

Sellers waste 10–15 minutes per listing navigating ill-fitting category trees, uploading images that get rejected, and filling fields irrelevant to electronics. Many abandon mid-way. Those who complete often write poor listings (no model number, vague condition) that fail to attract buyers, reinforcing the belief that "online selling doesn't work for electronics."

### Esparex's differentiation

Esparex is purpose-built for the electronics aftermarket:

- **Structured catalog tree:** Category → Brand → Model → Spare Part → Screen Size. A phone listing maps to the exact OEM model (iPhone 14 → 6.1" OLED), not a generic text field.
- **Business profiles:** Repair shops and refurbishers get verified business pages with service listings.
- **Location-native:** City/state hierarchy with geo-coordinates for local pickup and service radius.
- **Fixed pricing + Ad Packs:** No bidding, no lead-gen friction. Seller sets a price, buyer buys.

---

## 2. Vision

### Who is the seller?

The Esparex seller is anyone in the electronics lifecycle with something to sell:

- A mobile repair technician with 200 used screens in inventory
- A spare parts retailer stocking chargers, batteries, and flex cables
- A refurbisher with 30 Grade-A iPhone 13 units
- A distributor clearing last-gen OEM accessories
- A wholesale supplier with bulk lots of phone cases
- An individual who upgraded their phone and wants to sell the old one
- A service provider offering screen replacement and battery repair

They are **busy, pragmatic, and margin-sensitive**. They are not professional e-commerce merchants. They know their inventory intimately but do not want to become content creators or SEO experts.

### Why are they using Esparex instead of alternatives?

- **It understands electronics.** They type "iPhone 14 Pro Max" and the catalog surfaces the exact model, spare parts, and screen size—no hunting through generic categories.
- **It's fast.** A listing should take under 3 minutes from start to publish. No GST, no brand authorization, no logistics setup.
- **It reaches local buyers.** A repair shop in Laxmi Nagar, Delhi wants buyers within 5 km. Esparex's location system delivers that.
- **It builds trust.** Verified business profiles, fixed prices, structured listings with OEM part numbers reduce buyer hesitation.
- **It respects their business.** No random takedowns. No spam feed. Moderated, category-specific listings.

### What outcome do they expect within 5 minutes?

1. **Opened Esparex** on mobile (most common) or desktop.
2. **Signed in** (or signed up via OTP in 20 seconds).
3. **Selected category → brand → model → optional spare part** in under 60 seconds.
4. **Filled title + price + condition** in under 90 seconds.
5. **Uploaded 2–3 photos** (camera roll, not staged product shots).
6. **Selected location** (auto-detected, tap to confirm).
7. **Reviewed and published.**
8. **Listing is live** within the session. No "pending review" limbo for clean listings.

---

## 3. User Personas

### Persona A: Mobile Repair Technician

| Attribute | Detail |
|-----------|--------|
| **Name** | Ramesh (representative) |
| **Shop type** | Independent phone repair kiosk in a market |
| **Inventory** | 50–200 loose spare parts (screens, batteries, charging ports, flex cables) |
| **Goals** | List individual parts fast. Move inventory quickly. Attract walk-in repair customers. |
| **Pain points** | Doesn't know OEM model numbers by heart. Has photos on phone but no time to crop/edit. Gets frustrated by forms that ask for fields irrelevant to spare parts. Previous experience: "OLX took 20 minutes and the listing was rejected twice." |
| **Tech proficiency** | Low–medium. Comfortable with WhatsApp, basic Google search. Uses mobile primarily. Types in Hinglish. |
| **Device usage** | 90% mobile (Android, budget device). 10% shop desktop for bulk. |
| **Esparex value** | Structured catalog means he selects "iPhone 14 → Screen" instead of typing a description. Location auto-detect means buyers from the same market find him. |
| **Tolerance for steps** | Low. If >5 minutes, abandons. |

### Persona B: Spare Parts Retailer

| Attribute | Detail |
|-----------|--------|
| **Name** | Priya |
| **Shop type** | Online + offline electronics parts store |
| **Inventory** | 500–2000 SKUs across multiple brands |
| **Goals** | Bulk-list similar items (e.g., 20 variants of iPhone screen). Maintain consistent pricing. Cross-sell related parts. |
| **Pain points** | Cannot repeat-list efficiently. Has to re-enter brand/model for every spare part variant. Wants a "duplicate and edit" flow. Needs business verification to build buyer trust. |
| **Tech proficiency** | Medium. Uses web for catalog management, mobile for quick listings. |
| **Device usage** | 60% mobile (listing individual items), 40% desktop (bulk operations). |
| **Esparex value** | Business profile with storefront. Structured catalog for precise part matching. Duplicate-listing capability (future). |
| **Tolerance for steps** | Medium if listing is bulk/repeatable. Low if each listing is manual from scratch. |

### Persona C: Refurbisher

| Attribute | Detail |
|-----------|--------|
| **Name** | Amit |
| **Business** | Buys used devices in bulk, grades them, resells |
| **Inventory** | 30–100 devices at a time, multiple models |
| **Goals** | List devices quickly with accurate condition grading. Sell in volume. Build reputation. |
| **Pain points** | Condition description is critical (Grade A vs Grade B) but current form has only "power on / power off". Needs to differentiate cosmetic vs functional condition. Wants to list multiple units of same model without re-entering data. |
| **Tech proficiency** | Medium–high. Comfortable with web apps. Uses laptop for bulk uploads. |
| **Device usage** | 50% mobile (quick listings), 50% desktop (bulk listing from spreadsheet). |
| **Esparex value** | Condition taxonomy (Grade A/B/C/D). Bulk listing support. Business verification badge. |
| **Tolerance for steps** | Higher if value per listing is high (₹5K+ devices). Low for cheap items. |

### Persona D: Individual Seller

| Attribute | Detail |
|-----------|--------|
| **Name** | Sneha |
| **Context** | Upgraded phone, wants to sell old one |
| **Inventory** | 1 device |
| **Goals** | Sell quickly. Get a fair price. No hassle. |
| **Pain points** | Unsure what to price. Doesn't know how to describe condition properly. Worried about scam buyers. |
| **Tech proficiency** | High (uses multiple apps daily). |
| **Device usage** | 100% mobile. Expects app-like UX. |
| **Esparex value** | Smart pricing suggestions (future AI feature). Simple flow. Trusted buyer ecosystem. |
| **Tolerance for steps** | Low. Will abandon if form asks for too much. |

### Persona E: Wholesale Supplier / Distributor

| Attribute | Detail |
|-----------|--------|
| **Name** | Vikram |
| **Business** | Distributor of OEM and third-party accessories |
| **Inventory** | Thousands of units across many SKUs |
| **Goals** | List bulk lots. Reach retailers and repair shops. Generate B2B leads. |
| **Pain points** | Current platform is B2C-focused. Cannot list "lot of 50 iPhone cases" as a wholesale offer. Price negotiation expected. |
| **Tech proficiency** | Low–medium. Prefers WhatsApp for business. |
| **Device usage** | 70% mobile (WhatsApp-based), 30% desktop. |
| **Esparex value** | B2B listing type. Wholesale pricing with "min order qty." |
| **Tolerance for steps** | Low if flow is B2C-oriented. Needs a different path. |

### Persona F: Service Provider

| Attribute | Detail |
|-----------|--------|
| **Name** | Sunil |
| **Business** | Mobile repair service (no parts sales) |
| **Inventory** | Services (screen repair, battery replacement, water damage repair) |
| **Goals** | Get service bookings from nearby customers. Display expertise. Set price range. |
| **Pain points** | Has to create a "listing" for a service, but the form is designed for physical products. Cannot set service area radius. Cannot publish a price range (₹500–1500). |
| **Tech proficiency** | Low. Runs shop via walk-ins and phone calls. |
| **Device usage** | 100% mobile. |
| **Esparex value** | Dedicated service listing flow. Location-based matching. Business profile. |
| **Tolerance for steps** | Low. Expects to type "screen repair" and be done. |

---

## 4. Business Goals

| # | Goal | Rationale | Success Threshold |
|---|------|-----------|-------------------|
| 1 | **Publish a listing in under 3 minutes** | Speed reduces abandonment. Electronics-savvy catalog removes guesswork. | Median time-to-publish ≤ 180s |
| 2 | **Reduce listing abandonment to <20%** | Current industry avg for classifieds is 40–60%. Structured wizard should cut this in half. | Step-by-step abandonment rate <20% across all steps |
| 3 | **Increase listing quality (completeness)** | Clean listings attract buyers. Enforce model selection, condition, and minimum image count. | >80% of listings have brand + model + condition + ≥2 images |
| 4 | **Reduce moderation overhead** | Pre-submission validation + duplicate detection should catch 90% of issues before a human moderator sees them. | Moderation rejections <5% of total submissions |
| 5 | **Increase buyer trust** | Verified business profiles + structured listings with OEM data reduce buyer's perceived risk. | Business verification rate >60% among active seller accounts |
| 6 | **Support mobile-first completion** | Most sellers use mobile. The flow must work on a 320px-wide screen with touch targets ≥44px. | Mobile listing completion rate ≥ desktop rate |
| 7 | **Reduce time-to-first-listing for new sellers** | First listing is the highest-friction moment. OTP sign-in + guided wizard should make it trivial. | New users publish first listing within first session ≥70% |

---

## 5. Seller Journey

### 5.1 Current Journey (as implemented)

```
Landing
    ↓
Post Ad button (protected route)
    ↓
Auth check → redirect to login if unauthenticated
    ↓
Posting balance check → redirect if 0 slots remaining
    ↓
PostAdPage (SSR)
    ↓
PostAdShell (4-state: loading/error/offline/content)
    ↓
Step 1: Listing Information
    ├── CategorySection (grid of icons)
    ├── BrandSection (searchable select)
    ├── ModelSection (searchable select)
    ├── SpecificationSection (dynamic attribute filters)
    ├── DeviceConditionSection (power_on / power_off toggle)
    └── (Spare parts via chips — partial)
    ↓
Step 2: Listing Details
    ├── TitleSection (text input, AI Suggest)
    ├── DescriptionSection (textarea, AI Enhance)
    ├── ImageUploadSection (grid, max 5, min 1)
    ├── PriceSection (number input, "Mark as Free" toggle)
    └── LocationSection (auto-detect + manual picker)
    ↓
Review & Submit
    ↓
Image upload to S3 (sequential per image)
    ↓
POST /api/v1/listings (create or update)
    ↓
Success modal → redirect to listing
```

**Notes on current implementation:**
- "Review" is implicit in Step 2 (all fields visible before submit)
- No explicit Review step before publish
- No draft save (form state lost on navigation)
- No bulk listing support
- No duplicate listing detection (server-side only after submit)
- Service and Spare Part listings are separate pages with separate, non-wizard forms

### 5.2 Desired Journey (Post Ad 2.0 target)

```
Landing (mobile or desktop)
    ↓
Tap "Sell" (prominent CTA, visible unauthenticated)
    ↓
Sign in via OTP — 20 seconds, phone-only flow
    ↓
(First-time seller?) → Quick tip overlay: "Snap 2 photos, set your price, done."
    ↓
Step 1: What are you selling?
    ├── Category cards (Mobile Phones, Tablets, Spare Parts, Accessories, Services)
    └── [Branch] Category → Brand → Model (auto-suggests based on input)
         └── Spare Part (if applicable) — preselected list based on model
    ↓
Step 2: Describe it
    ├── Title (pre-filled from model: "iPhone 14 Pro Max — 128GB — Silver")
    ├── Condition (power_on / power_off toggle)
    ├── Price (opt-in AI suggestion: "Similar listings are ₹35,000–42,000")
    └── Description (optional, opt-in AI-suggested from specs)
    ↓
Step 3: Add photos
    ├── Tap to snap (camera) or select from gallery
    ├── Auto-compress on device
    ├── Max 8 images, min 1
    └── AI-enhanced thumbnail crop
    ↓
Step 4: Where are you?
    ├── Auto-detect location (tappable confirmation)
    ├── Or type city / pincode
    └── Optional: exact pickup address for local buyers
    ↓
Step 5: Review & Publish
    ├── Full listing preview (as buyer will see it)
    ├── Edit any section (inline, no step navigation needed)
    ├── Show posted count / remaining balance
    ├── "Buy Ad Pack" if 0 remaining
    └── Tap "Publish Now"
    ↓
Published! ✅
    ├── Share on WhatsApp button
    ├── View listing button
    ├── Track views (live counter)
    └── "List another similar" (duplicate + edit — follow-up project)
```

**Key improvements over current:**
- **5-step progressive disclosure** instead of 2 dense steps — each step has a single clear job
- **Smart pre-fill** from catalog (title)
- **Binary condition** (power_on / power_off) — kept intentionally simple
- **Opt-in AI** (title suggest, description enhance, price band) — behind a "Suggest" button; must comply with existing validation rules
- **Explicit Review step** before publish
- **Share on WhatsApp** — meets sellers where they are
- **Navigation guard** (keep existing) — exit confirmation dialog prevents accidental data loss

---

## 6. Success Metrics (KPIs)

### 6.1 Funnel Metrics

| KPI | Definition | Target | Current Baseline |
|-----|-----------|--------|-----------------|
| **Listing initiation rate** | % of sessions that start the wizard | >40% | Unknown (measure) |
| **Step 1 completion** | % who finish category → brand → model | >85% | Unknown (measure) |
| **Step 2 completion** | % who fill title + price + condition | >80% | Unknown (measure) |
| **Step 3 completion** | % who upload at least 1 image | >75% | Unknown (measure) |
| **Step 4 completion** | % who confirm location | >90% | Unknown (measure) |
| **Publish rate** | % who reach publish from start | >60% | Unknown (measure) |
| **Abandonment by step** | Drop-off per step | <10% per step | Unknown (measure) |

### 6.2 Time Metrics

| KPI | Definition | Target |
|-----|-----------|--------|
| **Time to publish (median)** | From landing to publish button | ≤180 seconds |
| **Time per step (median)** | Per-step elapsed time | Step 1: ≤60s, Step 2: ≤45s, Step 3: ≤45s, Step 4: ≤15s, Step 5: ≤15s |
| **Image upload time (p95)** | From selection to upload complete | ≤5 seconds per image |
| **First listing time (new user)** | From sign-up to first publish | ≤4 minutes |

### 6.3 Quality Metrics

| KPI | Definition | Target |
|-----|-----------|--------|
| **Listings with model selected** | % of published listings | >90% |
| **Listings with ≥2 images** | % of published listings | >80% |
| **Listings with condition set** | % of published listings | >95% |
| **Moderation rejection rate** | % of submissions flagged | <5% |
| **Buyer inquiry rate per listing** | Messages received in first 7 days | >3 (target TBD after baseline) |
| **Duplicate listing rate** | % detected server-side | <3% (after pre-submit detection) |

### 6.4 Business Metrics

| KPI | Definition | Target |
|-----|-----------|--------|
| **Ad Pack purchase rate** | % of sellers who exhaust free slots | >20% |
| **Seller retention (30d)** | % who post a second listing within 30 days | >40% |
| **Listing-to-sale conversion** | % of listings that receive a buyer message | >40% |

---

## 7. Constraints

### 7.1 Business Constraints

| Constraint | Detail |
|-----------|--------|
| **Posting quota** | Free users have limited slots (configurable). Must check balance before starting wizard. "Buy Ad Pack" CTA when exhausted. |
| **Category-specific rules** | Some categories require different fields (e.g., spare parts require model linkage, services require business profile). The flow must adapt dynamically per category. |
| **Business verification** | Service listings and spare part listings require identity/additional verification. Non-verified users see a gated flow. |
| **Duplicate detection** | Prevent identical listings from the same seller within 30 days. Check pre-submit (UI warning) and server-enforced. |
| **Fraud moderation** | New seller listings may require auto-moderation flags. High-risk patterns (new account + high-value item) trigger review. |
| **Pricing integrity** | ₹0 listings are "free" listings (must use isFree flag). Price must be ≤₹10,000,000. |

### 7.2 Technical Constraints

| Constraint | Detail |
|-----------|--------|
| **Image limits** | Min 1, max 5 (ads) — *consider increasing to 8* |
| **Image file size** | Must be compressible under 5MB per image. HEIC/HEIF supported via conversion. |
| **Image format** | JPEG, PNG, WebP, HEIC accepted |
| **Title length** | 10–100 characters. Profanity/gibberish checked at client + server. |
| **Description length** | 20–500 characters. Profanity/gibberish checked. |
| **Location** | Must resolve to a valid city+state+coordinates pair from the location hierarchy. Cannot be free-text. |
| **Brand/Model** | Must reference canonical IDs from catalog, not free text. |
| **Category** | Must reference a canonical category ID. |
| **Mobile-first** | All UI must work on 320px+ screens. Touch targets ≥44px. WCAG AA. |
| **Offline resilience** | Draft saves to localStorage. Network loss shows offline state gracefully (already implemented in shell). |
| **Auth** | Phone OTP (Firebase). Session via JWT. |
| **Image upload pipeline** | Sequential per image to S3 (current). *Consider parallel uploads.* |
| **API idempotency** | POST /api/v1/listings has idempotency middleware. Frontend must pass idempotency key. |

### 7.3 Mobile UI/UX Requirements

| Requirement | Detail |
|------------|--------|
| **Touch targets** | All interactive elements (buttons, selects, checkboxes, chips) must have minimum touch target of 44×44px. |
| **Selection components** | Dropdowns, searchable selects, category grids, brand/model pickers, and spare part chips must be touch-optimized. Long lists (>10 items) must support search/filter. |
| **Scrolling** | Minimize vertical scrolling per step. Fixed headers, sticky footers, and collapsible sections where appropriate. |
| **Responsive layout** | Single-column on mobile (<768px), multi-column on tablet/desktop. No horizontal scroll. |
| **Input ergonomics** | Text inputs and textareas must have adequate tap areas, clear labels, and visible focus states. Number inputs must trigger numeric keyboard on mobile. |
| **Loading states** | Category/brand/model async loads must show skeleton placeholders, not spinners that shift layout. |
| **Consistency** | All selection patterns must behave consistently across categories, brands, models, spare parts, and locations. No mixing of interaction patterns (e.g., don't use chips in one step and checkboxes in another for the same type of selection). |
| **Performance** | No visible lag (>100ms) on tap feedback. Brand/model search must respond in <500ms. Image upload feedback must show progress per image. |

### 7.4 Performance Targets

| Target | Detail |
|-------|--------|
| **Page load (SSR)** | <2s (TTFB + first paint) |
| **Catalog search response** | <500ms for brand/model autocomplete |
| **Image upload (S3)** | <3s per image (p95) on 4G |
| **API create listing** | <1s (p95) excluding image upload |
| **Client JS bundle** | Post-ad wizard should be lazy-loaded. Total <150KB gzipped for wizard chunk. |

### 7.5 Regulatory / Compliance

| Requirement | Detail |
|------------|--------|
| **User data** | Phone numbers not publicly exposed. Chat is in-app only. |
| **Content moderation** | Listings must comply with electronics marketplace regulations. No counterfeit/spurious parts (flag on OEM trademarked terms). |
| **Pricing display** | All prices in INR (₹). No currency selection. |
| **Age restriction** | Sellers must be 18+. Verified during KYC for business accounts. |

---

## 8. Open Questions — Resolved

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Wizard container: page vs modal? | **Full-screen page.** Responsive: mobile gets full-screen, desktop gets centered layout. | Post Ad is a primary multi-step workflow, not a quick action. Modal is too restrictive for 2–5 min sessions with images. |
| 2 | Image upload placement? | **Own step (Step 3).** Keep it as a dedicated step after description and price. | Prevents overload in any single step. Images work best when the seller has already described the item. |
| 3 | Condition taxonomy? | **Keep current: `power_on` / `power_off`.** No additional condition grades. | Binary status is sufficient for Esparex's business model. Keeps listing creation simple and fast. |
| 4 | Draft auto-save? | **None.** No auto-save, no step-transition save. Keep existing exit confirmation dialog only. | Existing navigation guard is sufficient. Auto-save adds complexity without proven need. Revisit based on user feedback. |
| 5 | Bulk listing in scope? | **Follow-up — separate project.** Post Ad 2.0 focuses on single-listing optimization. | Scope discipline. Bulk listing ("duplicate + edit" and CSV upload) belongs in a dedicated follow-up. |
| 6 | AI features default? | **Optional opt-in.** AI suggestions behind a "Suggest" button (current pattern). | Sellers have full control. AI assists, never presumes. |
| 7 | Free listing allowance? | **5 free listings per user.** | Industry standard for classifieds. Balances acquisition and monetization.

---

## 9. Deliverables for Step 2 (Implementation Audit)

With this BRD as the reference, Step 2 will:

1. **Audit** the current codebase against each requirement in this document.
2. **Identify gaps** — missing steps, wrong step order, missing fields, validation discrepancies.
3. **Score compliance** per section (Vision alignment, Persona support, Journey mapping, KPI readiness, Constraint adherence).
4. **Produce a gap analysis** document with specific code-level findings.

**Every subsequent decision** — UI layout, component hierarchy, state management, validation rules — will trace back to a specific requirement in this BRD.

---

*End of Seller Experience BRD v1.0*
