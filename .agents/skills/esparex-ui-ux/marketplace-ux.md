# Esparex Web Marketplace UX Standards

The Web Marketplace (`apps/web`) serves buyers, sellers, repair shops, and spare-part dealers.
Its primary goals are **trust, rapid discovery, clear price presentation, and effortless ad posting**.

---

## 1. Product & Service Listing Cards

- **Image Ratio**: 4:3 image aspect ratio with cover object fit.
- **Price Tag**: Display pre-computed canonical price (`ad.formattedPrice` or `₹X,XXX`) in bold Indigo Action (`text-action font-bold`).
- **Location & Date**: Display city/area badge (`Mumbai, MH`) and time ago (`2 hours ago`).
- **Trust Badges**: Verified Seller badge, Featured Boost icon.

---

## 2. Post-Ad Wizard & Form Patterns

- **2-Step Wizard**: Step 1 (Category $\rightarrow$ Brand $\rightarrow$ Model selection), Step 2 (Title, Description, Price, Images, Location).
- **Inline Validation**: Validate fields on blur/change with clear contextual guidance.
- **Image Upload Grid**: Drag-and-drop media uploader with thumbnail previews, drag reordering, and main cover indicator.

---

## 3. Trust Signals & Conversion Features

- Direct "Chat with Seller" CTA button (`bg-action text-white`).
- "Call Seller" secondary button.
- Safety & Verification trust banner on listing detail page.
