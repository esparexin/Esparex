# Esparex — Google Brand Entity & Search Remediation Playbook

## 1. Executive Summary & Objective

**Official Brand & Canonical Domain:**  
- **Brand:** Esparex  
- **Canonical Domain:** `https://esparex.in`  
- **Entity Type:** Dedicated Indian Online Marketplace for Genuine Mobile Spare Parts, Refurbished Electronics, and Tech Repair Services.

**Problem Observed:**  
When searching Google for the exact brand name `esparex`, Google currently displays:
> *"These are results for sparex"*  
> *"Search instead for esparex"*

This issue is a Google Search query interpretation and brand entity recognition problem. Google's spellchecker compares the unspaced query `esparex` against established entities and misclassifies it as a typographical error for the 60-year-old agricultural and tractor parts supplier *Sparex* (`sparex.com` / `sparexindia.com`).

**Remediation Goal:**  
Strengthen Google's brand entity signals so that `esparex` is recognized as an unambiguous proper noun and primary Knowledge Graph entity associated strictly with `https://esparex.in`.

```
Esparex  ──►  Distinct Brand Entity  ──►  https://esparex.in
(NOT: Esparex ──► Sparex)
```

---

## 2. Root Cause Analysis

The Google brand-confusion issue stems from a combination of search engine NLP behavior and previous technical metadata patterns:

### A. Technical Factors (Remediated in Codebase)
1. **Brand Demoted in Critical Entity Anchors:**  
   The homepage `<title>`, `<meta property="og:title">`, and `<meta name="twitter:title">` previously began with generic category keywords:  
   `"Buy & Sell Mobile Spare Parts Online India | Esparex"`.  
   Because Google algorithms assign maximum entity weight to the initial tokens of the title, placing the brand token at the end weakened its signal.
2. **Generic, Diluted `<h1>` Heading:**  
   The homepage server-rendered `<h1>` was:  
   `<h1 className="sr-only">Buy & Sell Mobile Spare Parts Online India — Esparex Marketplace</h1>`.  
   This pushed the brand to the end and introduced the non-canonical variant `"Esparex Marketplace"`.
3. **Incomplete Schema.org Knowledge Graph Signals:**  
   The `buildOrganizationSchema()` lacked the `sameAs` cross-referencing array entirely. Search engine knowledge extractors require authoritative social/web handles (`@esparexin`) to link an entity across web properties.
4. **Entity Token Fragmentation Across Subpages:**  
   Subpages rendered Schema.org `publisher` or `mainEntity` with `name: "Esparex Platform"`, while the homepage rendered `name: "Esparex"` with `alternateName: ["Esparex Marketplace", "Esparex India", "Esparex.in"]`. This fragmented Google's entity graph into multiple competing strings.
5. **Contract TLD Inconsistencies:**  
   `packages/contracts/src/v1/common/constants/brand.ts` listed `websiteUrl: 'https://esparex.com'` and `supportEmail: 'support@esparex.com'`, causing inconsistent brand signals across invoices, PDFs, and metadata.

### B. Google Query Correction Mechanics (External Factor)
1. **Levenshtein Distance & Phonetic Similarity:** `esparex` differs from `sparex` by only one leading letter ('e').
2. **Semantic Domain Closeness:** Both websites feature the words "spare", "parts", and "repair".
3. **Historical Entity Weight:** The third-party brand *Sparex* was founded in 1965 in the UK and operates across 17 countries with an Indian subsidiary (`sparexindia.com`). In the absence of an established knowledge graph entity for *Esparex*, Google's RankBrain and MUM models default to high-frequency query correction.

---

## 3. Implemented Code & Technical SEO Changes

All code remediation follows single source of truth (SSOT) architecture with zero UI redesign and zero business logic modifications:

### 1. Brand Contracts SSOT (`packages/contracts/src/v1/common/constants/brand.ts`)
- Updated `websiteUrl` to canonical `'https://esparex.in'`.
- Updated `supportEmail` to canonical `'support@esparex.in'`.
- Maintained authoritative legal name `'Esparex Marketplace Private Limited'` and trade name `'Esparex'`.

### 2. Schema.org Organization Entity (`apps/web/src/lib/seo/brandEntitySchema.ts`)
- Enforced canonical `name: "Esparex"`.
- Removed `alternateName` array to eliminate entity token dilution.
- Pointed logo to official canonical asset: `${CANONICAL_ORIGIN}/icons/logo.png` (495x112px).
- Injected authoritative `sameAs` array:
  ```json
  "sameAs": [
    "https://x.com/esparexin",
    "https://twitter.com/esparexin",
    "https://github.com/esparexin"
  ]
  ```

### 3. Structured Data Alignment Across Informational Pages (`apps/web/src/lib/seo/schemaBuilders.ts`)
- Standardized `publisher.name` and `mainEntity.name` to `"Esparex"` across `buildWebPageSchema`, `buildContactPageSchema`, and `buildAboutPageSchema`.
- Included `sameAs` social profiles and official logo in `AboutPage` and `ContactPage` schemas.

### 4. Brand-First Homepage Metadata & Semantic H1 (`apps/web/src/app/(public)/page.tsx`)
- Updated homepage `<title>`, `og:title`, and `twitter:title` to:  
  `"Esparex — India's Marketplace for Mobile Spare Parts & Tech Repair"`.
- Updated server-rendered `<h1>` to:  
  `<h1 className="sr-only">Esparex — India&apos;s Marketplace for Mobile Spare Parts &amp; Tech Repair</h1>`.

### 5. Layout Metadata & Accessibility Alt Text
- Aligned `apps/web/src/app/(public)/layout.tsx` default title with canonical brand positioning.
- Standardized logo alt text across desktop header, mobile header, and drawer to `"Esparex"`.
- Updated footer copyright to: `© {currentYear} Esparex. Built for the future of tech repair.`

---

## 4. External Google Actions Playbook (Required Outside Codebase)

Repository code provides the technical foundation. To train Google's entity graph and stop query correction, complete the following actions:

### Phase A: Google Search Console (GSC)
1. **URL Inspection & Priority Re-indexing:**
   - Open [Google Search Console](https://search.google.com/search-console).
   - Enter `https://esparex.in/` in the URL Inspection tool.
   - Click **Test Live URL** to verify Googlebot receives the updated HTML with the new Schema.org JSON-LD and title tag.
   - Click **Request Indexing**.
   - Repeat for key entity pages: `https://esparex.in/about` and `https://esparex.in/contact`.
2. **Sitemap Re-submission:**
   - Under **Sitemaps**, verify `https://esparex.in/sitemap.xml` is submitted and shows *Success*.
   - Re-submit if the last read date is older than 7 days.
3. **Query Performance Tracking:**
   - Monitor the **Performance** report filtered by Queries containing:
     - `esparex`
     - `esparex in`
     - `esparex india`
     - `esparex marketplace`
   - Track impressions and click-through rates (CTR) on the exact query `esparex`.

### Phase B: Official Social & External Entity Consistency
Google builds Knowledge Graph entities by corroborating external signals. Ensure all official accounts identify the entity consistently:

| Platform | Handle / URL | Requirement |
| :--- | :--- | :--- |
| **X (Twitter)** | `https://x.com/esparexin` | Bio must state "Esparex — India's tech repair & mobile spare parts marketplace." Link must be `https://esparex.in`. |
| **GitHub** | `https://github.com/esparexin` | Organization name: "Esparex", Website: `https://esparex.in`. |
| **LinkedIn** | Company Page | Company Name: "Esparex", Industry: Internet Marketplace, Website: `https://esparex.in`. |
| **Google Business Profile** | Where eligible | Business Name: "Esparex", Website: `https://esparex.in`. |

*Note: Do not create fake profiles, spam web directories, or automated backlink schemes. Google's entity disambiguation relies exclusively on authoritative, consistent citations.*

---

## 5. Legal & Brand Safety Advisory

The existence of the unrelated enterprise *Sparex* (agricultural parts manufacturer) is noted as a business consideration:
- **No Trademark Infringement Claim:** Esparex operates as an Indian consumer electronics, smartphone spares, and repair services marketplace, distinct from agricultural tractor machinery.
- **Actionable Recommendation:** Brand trademark registration and clearance in India (under relevant Classes: Class 35 for marketplace services, Class 37 for repair services, Class 9 for electronics) should be maintained and reviewed with a qualified Indian intellectual property/trademark attorney.

---

## 6. Verification & Automated Regression Suite

The changes are protected by automated tests:
- **`apps/web/src/__tests__/brand-entity-schema.spec.ts`**:
  - Verifies Organization Schema outputs canonical name `Esparex`, logo `logo.png`, and `sameAs` array.
  - Verifies absence of `alternateName` dilution.
  - Verifies WebSite schema publisher links to `#organization`.
  - Verifies About & Contact schemas use `Esparex`.
  - Verifies homepage metadata leads with brand token.
- **`apps/web/src/__tests__/seo-sitemap.spec.ts`**:
  - Validates sitemap generation, canonical HTTPS origin, and robots policy.

---

## 7. Search Algorithm Limitation & Expected Timeline

Search query interpretation and spell-checking are managed dynamically by Google's proprietary algorithms:
- **No Instant Switch:** No code change can force Google to immediately drop the "Showing results for sparex" banner overnight.
- **Algorithm Adaptation Window:** Typically, Google requires **2 to 6 weeks** after re-crawling updated entity markup and observing consistent user click behavior ("Search instead for esparex") to establish confidence in `esparex` as a distinct entity and cease autocorrecting to `sparex`.
