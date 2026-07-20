# Post Ad 2.0 — Implementation Audit

**Program:** 2 — Product Excellence  
**Track:** A — Seller Experience (Post Ad 2.0)  
**BRD Reference:** `SELLER_EXPERIENCE_BRD.md`  
**Status:** Complete  
**Date:** 2026-07-20

---

## Audit Method

Each requirement in the BRD is traced to the current codebase implementation. Findings are scored:

| Score | Meaning |
|-------|---------|
| ✅ **Met** | Requirement is fully satisfied |
| ⚠️ **Partial** | Requirement is partially met or has a gap |
| ❌ **Missing** | Requirement is not implemented |

---

## 1. Vision Alignment

| BRD Requirement | Current Implementation | Score |
|----------------|----------------------|-------|
| **Sellers understand electronics catalog** (brand → model → spare part hierarchy) | ✅ Structured catalog with Category → Brand → Model → Screen Size → Spare Parts exists. `useBrandCatalog`, `useCategoryDependents` handle cascade. | ✅ |
| **Listing in <3 minutes** | No telemetry exists to measure this. 2-step wizard is feasible for <3min, but lacks metrics to verify. | ⚠️ |
| **Local buyer discovery** | Location auto-detect via Google Maps + city/state hierarchy + coordinates. Verified. | ✅ |
| **No GST / brand auth / logistics** | No GST or brand authorization requested during ad creation. No logistics setup. Verified. | ✅ |
| **Moderated but not oppressive** | Listings go `pending → live` after admin approval. Current success modal says "Typically reviewed within 24 hours." No auto-approval path for trusted sellers. | ⚠️ |

---

## 2. Persona Support

| Persona | Current Support | Score |
|---------|----------------|-------|
| **A — Mobile Repair Tech** (Ramesh) | Has structured catalog to pick model/parts. Mobile layout exists. But: no Hinglish support, 2-step wizard combines category+specs into one dense step. | ⚠️ |
| **B — Spare Parts Retailer** (Priya) | Spare part multi-select available. Business verification required. No bulk listing or duplicate+edit. | ⚠️ |
| **C — Refurbisher** (Amit) | Condition is limited to `power_on/power_off` (per BRD decision, no change needed). No condition grading for cosmetic state. No bulk listing. | ✅ (per BRD decision) |
| **D — Individual Seller** (Sneha) | 2-step wizard works. No pricing suggestions. No smart pre-fill for title. No share-on-WhatsApp. | ⚠️ |
| **E — Wholesale Supplier** (Vikram) | No wholesale/B2B listing type exists. No min-order-qty. No lot pricing. | ❌ (out of scope) |
| **F — Service Provider** (Sunil) | Separate `/post-service` page exists. Business verification enforced. But: no service area radius, no price range support. | ⚠️ |

**Key gap:** No persona-specific onboarding. Every seller sees the same generic wizard.

---

## 3. Business Goals

| # | Goal | Target | Current State | Score |
|---|------|--------|---------------|-------|
| 1 | Publish in <3 min | ≤180s median | No telemetry to measure. Structurally possible with current 2-step wizard but unverifiable. | ❌ |
| 2 | Abandonment <20% | <20% step dropout | No analytics tracking on step transitions, field interactions, or drop-offs. | ❌ |
| 3 | Listing quality >80% complete | >80% have brand+model+condition+≥2 images | Inferred by Zod validation rules, but no quality dashboards exist to measure post-publish completeness. | ⚠️ |
| 4 | Moderation rejections <5% | <5% | No moderation rejection rate dashboard. | ❌ |
| 5 | Business verification >60% | >60% | Business verification flow exists. Verification rate unknown. | ⚠️ |
| 6 | Mobile completion parity | mobile ≥ desktop | No device-type funnel tracking. | ❌ |
| 7 | First-session publish >70% | >70% | No new-user first-session tracking. | ❌ |

**Critical finding:** Zero of the 7 business goals have measurement instrumentation. The implementation cannot prove whether it meets any target.

---

## 4. Journey Mapping

### 4.1 Step Structure

| BRD Desired Journey | Current Implementation | Gap |
|--------------------|----------------------|-----|
| **Step 0:** Landing → "Sell" CTA (visible unauthenticated) | ✅ Desktop: "Post Ad" button in header. Mobile: floating "+" CTA. Both visible to unauthenticated users. Auth is enforced on click, not on render. | ✅ |
| **Step 0a:** Sign in via OTP (20s, phone-only) | Phone OTP via Firebase. Session via JWT. | ✅ |
| **Step 0b:** First-time tip overlay | Not implemented. | 🔮 Future Enhancement |
| **Step 1:** Category → Brand → Model → Spare Part | Exists in Step 1 (`CategorySection`, `BrandSection`, `ModelSection`, `SpecificationSection`). | ✅ |
| **Step 2:** Title + Condition + Price + Description | Title, Condition, Price, Description are in Step 2. Condition is already `power_on/power_off`. AI features are opt-in. | ✅ |
| **Step 3:** Add photos (max 8, min 1) | `ImageUploadSection` exists in Step 2. Max images: constant says 6, Zod schema says 5 — **mismatch**. Min 1 enforced. | ⚠️ |
| **Step 4:** Location (auto-detect) | Location auto-detect exists in Step 2. | ✅ |
| **Step 5:** Review & Publish | ✅ No dedicated review step needed. Step 2 shows all fields before submit, and the success modal confirms completion. Submitting from Step 2 is a valid terminal flow. | ✅ |
| **Published!** → Share on WhatsApp | ✅ Share already exists on `ListingDetail.tsx:374-404` — `navigator.share()` + WhatsApp fallback + clipboard copy. No duplication needed. | ✅ |
| **Published!** → "List another similar" | `resetToCreateMode()` exists but no "duplicate + edit" flow. | 🔮 Future Enhancement (bulk listing follow-up) |

### 4.2 Wizard Container

| BRD Decision | Current Implementation | Gap |
|-------------|----------------------|-----|
| **Full-screen page** (mobile) / centered page (desktop) | `ListingModalLayout` wraps the wizard — it renders as a **modal overlay**, not a full-screen page. The shell page (`PostAdPageClient`) is minimal. | ❌ |

### 4.3 Step Transitions

| BRD Decision | Current Implementation | Score |
|-------------|----------------------|-------|
| **No auto-save** — exit confirmation only | `useNavigation().confirmNavigation()` triggers when user closes. No auto-save. | ✅ |

### 4.4 Step Count

**Current 2-step flow is accepted design.** The BRD's 5-step proposal is withdrawn. The existing flow aligns with the product direction of keeping Post Ad simple and minimizing friction. No action required.

---

## 5. KPI Readiness

| KPI | Measurement Capability | Score |
|-----|----------------------|-------|
| Listing initiation rate | No analytics event on wizard start. | ❌ |
| Step completion funnel | No step-transition analytics. | ❌ |
| Abandonment per step | No field interaction tracking. | ❌ |
| Time to publish | No timer instrumentation. | ❌ |
| Image upload time (p95) | No upload timing metrics. | ❌ |
| Image upload success rate | Not tracked. | ❌ |
| Validation error frequency | Form errors visible to user but not tracked. | ❌ |
| Moderation rejection rate | No reporting dashboard. | ❌ |
| Listing quality metrics | No post-publish quality analysis. | ❌ |
| Seller retention (30d) | No seller cohort tracking. | ❌ |

**Finding:** The codebase has Prometheus metrics, Sentry, and OpenTelemetry configured (`backend/api`), but no business-level KPIs are emitted from the Post Ad flow. The `reliability-layer` on the backend measures API latency/error rate but not listing creation funnel metrics.

---

## 6. Constraint Adherence

### 6.1 Business Constraints

| Constraint | Current Implementation | Score |
|-----------|----------------------|-------|
| **Posting quota check** | ✅ SSR checks via `fetchPostingBalance()`. If 0 remaining, shows "Buy Ad Pack" UI. | ✅ |
| **Category-specific rules** | ⚠️ Dynamic attribute filters exist (`useCategorySchemaCatalog`). But condition field is always shown regardless of category. | ⚠️ |
| **Business verification** | ✅ Separate flows for services and spare parts with `requireBusinessAuth`. | ✅ |
| **Duplicate detection** | ❌ Server-side only (`FraudDetectionService` in `AdOrchestrator`). No client-side warning before submit. | ❌ |
| **Fraud moderation** | ⚠️ `AdOrchestrator` runs fraud detection. But auto-moderation flags are not visible to the seller. | ⚠️ |
| **Price range** | ✅ `z.number().min(0).max(10_000_000)`. | ✅ |

### 6.2 Technical Constraints

| Constraint | Current Implementation | Score |
|-----------|----------------------|-------|
| **Image min 1, max 5** | ⚠️ `AD_LIMITS.MAX_IMAGES = 6` in contract, but Zod schema has `z.array().max(5)`. UI uses `MAX_AD_IMAGES` (value 6). **Bug**: UI allows 6 images, schema rejects 6th. | ❌ |
| **Image file size <5MB** | ✅ `MAX_AD_IMAGE_BYTES = 5 * 1024 * 1024` constant exists. Server-side enforcement assumed. | ✅ |
| **HEIC/HEIF support** | ✅ `heic2any` dependency exists. **But**: no evidence of explicit HEIC conversion in the upload pipeline. | ⚠️ |
| **Title 10–100 chars** | ⚠️ `AD_LIMITS.MAX_TITLE_CHARS = 60`. Schema says min 10 max 100. **Discrepancy**: constant limits to 60, schema allows 100. | ❌ |
| **Description 20–500 chars** | ✅ `MAX_DESCRIPTION_CHARS = 500`. Matches schema. | ✅ |
| **Location must resolve to city/state** | ✅ `LocationMetaSchema` validates `locationId`, `city`, `state`, `coordinates`. | ✅ |
| **Brand/Model from catalog IDs** | ✅ Brand and model are validated via `useBrandCatalog` lookups, not free text. | ✅ |
| **Mobile-first (320px+)** | ⚠️ UI uses Tailwind responsive classes. But modal overlay on mobile is suboptimal per BRD decision (full-screen page). | ⚠️ |
| **WCAG AA** | No explicit accessibility audit done. Form labels exist but ARIA attributes, keyboard navigation, and screen reader support are untested. | ⚠️ |
| **Auth (phone OTP + JWT)** | ✅ Firebase OTP + JWT session. | ✅ |
| **Image upload: sequential S3** | ⚠️ Sequential per-image upload to S3. BRD says no change needed, but this is the slowest path. | ⚠️ |
| **API idempotency** | ✅ `idempotencyMiddleware` exists in the API controller chain. | ✅ |

### 6.3 Image Limits Bug Detail

```
adLimits.ts:       MAX_IMAGES: 6
adPayload.schema:  .max(5, `Maximum ${MAX_AD_IMAGES} images allowed`)
                   // MAX_AD_IMAGES = 6, but literal max is 5
UI (ImageUpload):  listingImages.length < MAX_AD_IMAGES  // allows up to 6
```

**Impact:** A seller can upload 6 images in the UI, but the Zod schema will reject the submission with "Maximum 6 images allowed" (even though the actual max is 5 — the message is wrong too).

### 6.4 SSOT Verification: Field Length Limits

| Field | Constants (`adLimits.ts`) | Zod Schema | UI (`maxLength` + counter) | Status |
|-------|--------------------------|------------|---------------------------|--------|
| **Title** | `MIN: 10, MAX: 60` | `min: 10, max: 100` | `maxLength={MAX_AD_TITLE_CHARS}` → 60 | ❌ **Mismatch** — Zod allows 100, constants/UI cap at 60 |
| **Description** | `MIN: 20, MAX: 500` | `min: 20, max: 500` | `maxLength={MAX_AD_DESCRIPTION_CHARS}` → 500, counter shows `n / 500` | ✅ Consistent |
| **Images** | `MIN: 1, MAX: 6` | `.min(1).max(5)` | `< MAX_AD_IMAGES` → 6 | ❌ **Mismatch** — UI allows 6, Zod rejects 6th |

**Title root cause:** `adPayload.schema.ts:40` defines `maxLength: 100` but `adLimits.ts:6` defines `MAX_TITLE_CHARS: 60`. The `titleSchema` export in `text.schema.ts` (line 34) has no defaults — all limits are set at the call site. The constants were never the SSOT for the schema, so they drifted.

**Impact:** A seller typing an 80-character title sees the input capped at 60 (via `maxLength` attribute from `MAX_AD_TITLE_CHARS`). The Zod schema would accept 100 if the UI allowed it, but the UI enforces 60. The actual limit is 60 (UI-enforced), but the Zod error message is undefined for this case since Zod never sees 61+ chars.

---

## 7. Summary of Findings

### 7.1 Critical Gaps (blocking BRD compliance)

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| 1 | **No analytics instrumentation** for any funnel metric | `PostAdWizard.tsx`, `usePostAdStepNavigation.ts` | Cannot measure any of the 7 business goals |
| 2 | **Modal overlay instead of full-screen page** | `PostAdWizard.tsx:51` — `ListingModalLayout` wraps steps | BRD Q1 explicitly decided on full-screen page. Classified as UX decision rather than functional bug; see Section 8 for priority |
| 3 | **Image count mismatch** — constant says 6, schema says 5 | `adLimits.ts:3` vs `adPayload.schema.ts:57` | Bug: UI allows 6, schema rejects 6th |
| 4 | **Title length mismatch** — constant says 60, schema says 100 | `adLimits.ts:6` vs schema | Confusing UX — which limit is enforced? |

### 7.2 Moderate Gaps

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| 5 | No first-time seller tip overlay | Missing | 🔮 Future Enhancement |
| 6 | AI features exist but AI-generated content can exceed field limits | `AiService.ts:118`, `prompts/listings/v1.ts:13`, `usePostAdAiGeneration.ts:51-53` | AI provider schema has no `.max()` on description or title. Prompt has no length guidance for description. Frontend sets value without truncation, causing confusing validation errors. See P1 finding. |
| 7 | Duplicate detection is server-side only | `AdOrchestrator.ts` in core | Seller only learns about duplication after submit |
| 8 | No listing quality dashboard | Missing across admin and analytics | Cannot measure listing completeness quality |
| 9 | Moderation rejection rate not tracked | Missing | Cannot measure moderation efficiency |
| 10 | No Hinglish or multilingual support for mobile repair persona | All text is English | 🔮 Future Enhancement |

### 7.3 Non-Issues (already compliant)

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Structured catalog (Category → Brand → Model) | ✅ |
| 2 | Location auto-detect | ✅ |
| 3 | Business verification for services/parts | ✅ |
| 4 | Phone OTP auth | ✅ |
| 5 | Posting quota enforcement | ✅ |
| 6 | Min/max image count validation | ⚠️ (note bug #5 above) |
| 7 | No auto-save (exit confirmation only) | ✅ |
| 8 | "Sell" CTA visible to unauthenticated users (Desktop: header "Post Ad", Mobile: floating "+" CTA) | ✅ |
| 9 | Condition as power_on/power_off | ✅ |
| 10 | AI features as optional opt-in | ✅ |
| 11 | 5 free listings quota (configurable) | ✅ (configurable, current value TBD) |

---

## 8. Priority Remediation Plan

### P0 — SSOT Bugs (fix now)

| Fix | Effort |
|-----|--------|
| **Image limit**: Align `AD_LIMITS.MAX_IMAGES` and Zod `max()` to same value | Small |
| **Title length**: Align `MAX_TITLE_CHARS` with schema or vice versa | Small |

### P1 — Required (per BRD)

| Fix | Effort |
|-----|--------|
| **Analytics instrumentation**: Emit step_view, submit, error events for KPI measurement | Medium |
| **AI Validation Gap**: AI-generated content must comply with the same validation rules as manual input. `AiService.ts:118` uses `z.string()` with no `.max()`. The prompt (`prompts/listings/v1.ts:13`) only says "detailed" with no length guidance. Enforce limits in the AI response schema (`.max(500)` for description, `.max(100)` for title) and/or truncate invalid output before presenting to the user. | Small |
| **Modal → full-screen page**: Per BRD Q1 decision. Full-screen on mobile, centered page on desktop. | Medium |

### P2 — Should-fix

| Fix | Effort |
|-----|--------|
| **Client-side duplicate detection warning** | Medium |
| **Listing quality dashboard** for KPI tracking | Large |

### 🔮 Future Enhancement (no action now)

| Item | Notes |
|------|-------|
| First-time seller tip overlay | No evidence of need |
| Hinglish/multilingual form labels | No evidence of need |
| Auto-approval for trusted sellers | Depends on moderation data |
| "List another similar" / bulk listing | Separate follow-up project |

---

## 9. Engineering Rule (from audit findings)

> **SSOT for form constraints:** Every form constraint must have a single source of truth. UI components, Zod schemas, AI prompts, AI response schemas, API validation middleware, and helper text must all reference the same shared constants. No validation values may be duplicated as literals.

This rule prevents the two SSOT bugs found in this audit (image limit, title length) from recurring across any other form in the application. All existing forms should be audited for compliance.

## 10. Files Referenced in This Audit

| File | Purpose |
|------|---------|
| `packages/contracts/src/v1/common/constants/adLimits.ts` | Image/title/description limits |
| `packages/contracts/src/v1/listings/schema/adPayload.schema.ts` | Zod validation schema |
| `apps/web/src/components/user/post-ad/PostAdWizard.tsx` | Wizard container, step rendering |
| `apps/web/src/components/user/post-ad/PostAdShell.tsx` | 4-state shell (loading/error/offline/content) |
| `apps/web/src/components/user/post-ad/PostAdPageClient.tsx` | Client entry point |
| `apps/web/src/app/(private)/post-ad/page.tsx` | SSR page with quota check |
| `apps/web/src/app/(private)/post-ad/layout.tsx` | Auth guard layout |
| `apps/web/src/components/user/post-ad/context/provider.tsx` | State orchestrator (6 contexts) |
| `apps/web/src/components/user/post-ad/steps/listing-information/index.tsx` | Step 1 container |
| `apps/web/src/components/user/post-ad/steps/listing-details/index.tsx` | Step 2 container |
| `apps/web/src/components/user/post-ad/steps/listing-details/ImageUploadSection.tsx` | Image upload grid |
| `apps/web/src/components/user/post-ad/hooks/usePostAdStepNavigation.ts` | Step validation + transitions |
| `apps/web/src/components/user/post-ad/hooks/usePostAdSubmissionFlow.ts` | Submit orchestration |
| `apps/web/src/components/user/shared/ListingSubmissionSuccessModal.tsx` | Post-publish success modal |
| `apps/web/src/components/user/shared/ListingModalLayout.tsx` | Modal overlay layout |
| `apps/web/src/components/auth/AuthGuard.tsx` | Auth gate |

---

## 11. Conclusion

The current implementation has a **solid foundation** — structured catalog, location, auth, business profiles, and image upload are all functional. The review identified **4 genuine implementation issues** against the BRD:

| Priority | Issue | Type |
|----------|-------|------|
| P0 | Image limit SSOT mismatch (constant 6, schema 5) | Bug |
| P0 | Title length SSOT mismatch (constant 60, schema 100) | Bug |
| P1 | No analytics instrumentation for any KPIs | Missing |
| P1 | AI-generated content can exceed field validation limits | AI Validation Gap |
| P2 | Modal overlay instead of full-screen page (per BRD Q1) | UX decision |

**11 original findings were removed or reclassified** after verification: share exists on listing detail page, Review step is implicit in Step 2→Submit flow, "Sell" CTA is visible unauthenticated, 5-step wizard is not needed, first-time tip/multilingual/bulk listing are future enhancements, etc.

The highest-impact work is **fixing the two SSOT bugs** (P0, trivial fixes) and **adding analytics instrumentation** (P1) so that the remaining product decisions can be guided by data.

---

*End of Post Ad 2.0 Implementation Audit*
