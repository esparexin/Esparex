# Esparex User-Facing Frontend: Complete Architecture & Page Inventory

```text
Status:          LIVING SINGLE SOURCE OF TRUTH (SSOT)
Owner:           Frontend & Mobile Architecture Team
Applies To:      Web Application (apps/web)
Framework:       Next.js 15 (App Router), React 19, TypeScript
Design Tokens:   @esparex/design-tokens
Component Lib:   @esparex/ui
Contracts:       @esparex/contracts
Document Ver:    1.0.0
Last Updated:    2026-09-19
```

---

## 📋 Table of Contents

1. [Executive Summary & Architectural Architecture](#1-executive-summary--architecture-principles)
2. [Master Route & Capability Matrix](#2-master-route--capability-matrix)
3. [Section I: Public Pages (Complete Inventory)](#3-section-i-public-pages-complete-inventory)
   - 3.1 [Home Page (`/`)](#31-home-page-)
   - 3.2 [Search & Browse Marketplace (`/search`)](#32-search--browse-marketplace-search)
   - 3.3 [Category Browse Page (`/category/[category]`)](#33-category-browse-page-categorycategory)
   - 3.4 [General Ad / Device Detail (`/ads/[slug]`)](#34-general-ad--device-detail-adsslug)
   - 3.5 [Spare Part Detail Page (`/spare-part-listings/[slug]`)](#35-spare-part-detail-page-spare-part-listingsslug)
   - 3.6 [Spare Part Legacy Redirect (`/spare-parts/[slug]`)](#36-spare-part-legacy-redirect-spare-partsslug)
   - 3.7 [Browse Spare Parts Redirect (`/browse-spare-parts`)](#37-browse-spare-parts-redirect-browse-spare-parts)
   - 3.8 [Services Directory / Landing (`/services`)](#38-services-directory--landing-services)
   - 3.9 [Service Detail Page (`/services/[slug]`)](#39-service-detail-page-servicesslug)
   - 3.10 [Browse Services Redirect (`/browse-services`)](#310-browse-services-redirect-browse-services)
   - 3.11 [Brand Catalog Page (`/brands/[slug]`)](#311-brand-catalog-page-brandsslug)
   - 3.12 [Model Catalog Page (`/models/[slug]`)](#312-model-catalog-page-modelsslug)
   - 3.13 [Business Directory Redirect (`/business`)](#313-business-directory-redirect-business)
   - 3.14 [Public Business Storefront (`/business/[slug]`)](#314-public-business-storefront-businessslug)
   - 3.15 [Public Seller Profile (`/seller/[id]`)](#315-public-seller-profile-sellerid)
   - 3.16 [How It Works (`/how-it-works`)](#316-how-it-works-how-it-works)
   - 3.17 [About Us (`/about`)](#317-about-us-about)
   - 3.18 [Contact Us & Grievance Redressal (`/contact`)](#318-contact-us--grievance-redressal-contact)
   - 3.19 [Help Center & FAQ (`/faq`)](#319-help-center--faq-faq)
   - 3.20 [Trust & Safety Guidelines (`/safety-tips`)](#320-trust--safety-guidelines-safety-tips)
   - 3.21 [Terms of Service (`/terms`)](#321-terms-of-service-terms)
   - 3.22 [Privacy Policy (`/privacy`)](#322-privacy-policy-privacy)
   - 3.23 [HTML Sitemap (`/site-map`)](#323-html-sitemap-site-map)
   - 3.24 [Unauthorized Access Notice (`/unauthorized`)](#324-unauthorized-access-notice-unauthorized)
   - 3.25 [PWA Offline Fallback (`/offline`)](#325-pwa-offline-fallback-offline)
4. [Section II: Private & Authenticated Pages (Complete Inventory)](#4-section-ii-private--authenticated-pages-complete-inventory)
   - 4.1 [User Profile & Account Info (`/account/profile`)](#41-user-profile--account-info-accountprofile)
   - 4.2 [My Ads / Listings Dashboard (`/account/ads`)](#42-my-ads--listings-dashboard-accountads)
   - 4.3 [My Repair Services (`/account/services`)](#43-my-repair-services-accountservices)
   - 4.4 [My Spare Parts Inventory (`/account/spare-parts`)](#44-my-spare-parts-inventory-accountspare-parts)
   - 4.5 [Saved / Favorite Ads (`/account/saved`)](#45-saved--favorite-ads-accountsaved)
   - 4.6 [Messages & Chat Inbox (`/account/messages`)](#46-messages--chat-inbox-accountmessages)
   - 4.7 [Direct Chat Conversation Thread (`/account/messages/[conversationId]`)](#47-direct-chat-conversation-thread-accountmessagesconversationid)
   - 4.8 [Esparex Wallet & Credits (`/account/wallet`)](#48-esparex-wallet--credits-accountwallet)
   - 4.9 [Subscription Plans & Ad Packs (`/account/plans`)](#49-subscription-plans--ad-packs-accountplans)
   - 4.10 [Purchase History & Invoices (`/account/purchases`)](#410-purchase-history--invoices-accountpurchases)
   - 4.11 [Smart Search & Price Alerts (`/account/alerts`)](#411-smart-search--price-alerts-accountalerts)
   - 4.12 [My Business Hub (`/account/business`)](#412-my-business-hub-accountbusiness)
   - 4.13 [Business Registration & KYC Application (`/account/business/apply`)](#413-business-registration--kyc-application-accountbusinessapply)
   - 4.14 [Business Profile Editor (`/business/edit`)](#414-business-profile-editor-businessedit)
   - 4.15 [Account Settings & Security (`/account/settings`)](#415-account-settings--security-accountsettings)
   - 4.16 [Post Ad Wizard (`/post-ad`)](#416-post-ad-wizard-post-ad)
   - 4.17 [Post Repair Service Wizard (`/post-service`)](#417-post-repair-service-wizard-post-service)
   - 4.18 [Post Spare Part Wizard (`/post-spare-part-listing`)](#418-post-spare-part-wizard-post-spare-part-listing)
   - 4.19 [Edit General Ad (`/edit-ad/[id]`)](#419-edit-general-ad-edit-adid)
   - 4.20 [Edit Repair Service (`/edit-service/[id]`)](#420-edit-repair-service-edit-serviceid)
   - 4.21 [Edit Spare Part Listing (`/edit-spare-part/[id]`)](#421-edit-spare-part-listing-edit-spare-partid)
5. [Section III: Global Modals, Floating Overlays & Cross-Cutting Flows](#5-section-iii-global-modals-floating-overlays--cross-cutting-flows)
   - 5.1 [Passwordless OTP Authentication Modal Flow](#51-passwordless-otp-authentication-modal-flow)
   - 5.2 [Hyper-Local Geolocation & Manual Location Selector](#52-hyper-local-geolocation--manual-location-selector)
   - 5.3 [Listing Promotion & Spotlight Boost Modal](#53-listing-promotion--spotlight-boost-modal)
   - 5.4 [Listing Abuse & Fraud Reporting Dialog](#54-listing-abuse--fraud-reporting-dialog)
   - 5.5 [Social Sharing & Web Share API Drawer](#55-social-sharing--web-share-api-drawer)
   - 5.6 [Unsaved Changes Form Guard Dialog](#56-unsaved-changes-form-guard-dialog)
6. [Section IV: System, Error & SEO Edge Handlers](#6-section-iv-system-error--seo-edge-handlers)

---

## 1. Executive Summary & Architecture Principles

The **Esparex User-Facing Frontend** (`apps/web`) is purpose-built as an aftermarket electronics and mobile spare parts discovery, commerce, and repair marketplace for the Indian subcontinent.

### Architectural Core Pillars
1. **Separation of Concerns (Public vs Private Route Groups)**:
   - `apps/web/src/app/(public)`: Completely indexable, search-engine optimized, static/ISR capable, public browsing routes.
   - `apps/web/src/app/(private)`: Strictly guarded routes protected by `proxy.ts` (edge rewrite/middleware) and client `AuthGuard`. Protected paths enforce authentication, role permissions, phone verification, and quota limits.
2. **SSOT Contract First**:
   - All payloads, forms, and DTO boundaries consume `@esparex/contracts`. No ad-hoc interface duplication in `apps/web`.
3. **Single-Instance Responsive Architecture**:
   - Zero duplicated top-level components (e.g. no separate `DesktopHeader` vs `MobileHeader`). Responsive layouts leverage CSS container queries and Tailwind responsive modifiers (`sm:`, `md:`, `lg:`, `xl:`).
4. **WCAG 2.2 AA Accessibility**:
   - Standardized 48dp touch targets on mobile viewports, 16px minimum input font sizes to prevent iOS Safari auto-zoom distortions, full keyboard navigation (Tab, Enter, Escape, Arrow keys), and semantic ARIA labeling.
5. **Hyper-Local Location Engine**:
   - City, locality, and GPS radius distance matching (default 50km) deeply integrated into search queries, feeds, and seller profiles.

---

## 2. Master Route & Capability Matrix

| # | Group | Route Path | Page / Feature Name | Guard / Prerequisite | Key Primary Capabilities |
|---|---|---|---|---|---|
| **1** | Public | `/` | Home Page | Public (Guest) | Category browser, personalized ad feed, auto-location prompt, banner ad slots, SEO schemas. |
| **2** | Public | `/search` | Search & Browse Marketplace | Public (Guest) | Multi-type switcher (Ads/Services/Parts), keyword search, price/brand/model filters, radius slider. |
| **3** | Public | `/category/[category]` | Category Browse Feed | Public (Guest) | Canonical category slug routing, pre-filtered listings grid, subcategory hierarchy. |
| **4** | Public | `/ads/[slug]` | Ad / Device Detail View | Public (Guest) | Lightbox gallery, price & condition, seller card, chat CTA, call reveal, share, report ad. |
| **5** | Public | `/spare-part-listings/[slug]`| Spare Part Detail Page | Public (Guest) | OEM vs aftermarket specs, model compatibility list, wholesale contact, chat inquiry. |
| **6** | Public | `/spare-parts/[slug]` | Spare Part Legacy Route | Public (Guest) | 301 Permanent Redirect to `/spare-part-listings/[slug]`. |
| **7** | Public | `/browse-spare-parts` | Spare Parts Browse Route | Public (Guest) | 301 Permanent Redirect to `/search?type=spare_part`. |
| **8** | Public | `/services` | Repair Services Directory | Public (Guest) | Hyper-local repair service discovery, service type filters, map radius proximity. |
| **9** | Public | `/services/[slug]` | Service Detail View | Public (Guest) | Price range (`min-max`), turnaround time, doorstep vs walk-in modes, verified technician card. |
| **10** | Public | `/browse-services` | Services Browse Route | Public (Guest) | 301 Permanent Redirect to `/services`. |
| **11** | Public | `/brands/[slug]` | Brand Catalog Landing | Public (Guest) | Brand overview, models taxonomy navigation, live brand listings feed. |
| **12** | Public | `/models/[slug]` | Model Catalog Landing | Public (Guest) | Device hardware specifications, live listings for model, available replacement spare parts. |
| **13** | Public | `/business` | Business Directory | Public (Guest) | 301 Permanent Redirect to `/`. |
| **14** | Public | `/business/[slug]` | Public Business Storefront | Public (Guest) | Verified business shield, shop address & hours, ads/services/parts catalog tabs. |
| **15** | Public | `/seller/[id]` | Public Seller Profile | Public (Guest) | Individual seller join date, trust score, verified phone badge, seller active ads feed. |
| **16** | Public | `/how-it-works` | How It Works Guide | Public (Guest) | Step-by-step guides for Buyers, Sellers, and Technicians. |
| **17** | Public | `/about` | About Esparex | Public (Guest) | Mission, vision, core values, platform governance overview. |
| **18** | Public | `/contact` | Contact & Grievance Desk | Public (Guest) | Customer support helpline, email, registered office address, statutory Grievance Officer details. |
| **19** | Public | `/faq` | Help Center & FAQ | Public (Guest) | 8 expandable accordion categories, search advice, transaction safety rules. |
| **20** | Public | `/safety-tips` | Trust & Safety Guidelines | Public (Guest) | Meetup safety checklist, scam prevention advice, counterfeit detection guide. |
| **21** | Public | `/terms` | Terms of Service | Public (Guest) | User agreement, prohibited items, listing rules, jurisdiction. |
| **22** | Public | `/privacy` | Privacy Policy | Public (Guest) | Data retention, phone visibility policies, cookie consent, deletion rights. |
| **23** | Public | `/site-map` | HTML Sitemap | Public (Guest) | Crawlable index of categories, catalog entities, and legal pages. |
| **24** | Public | `/unauthorized` | Unauthorized Access Page | Public (Guest) | Warning screen for unauthorized role access with login switcher. |
| **25** | Public | `/offline` | PWA Offline Fallback | Public (Guest) | Service worker offline screen with reconnect retry handler. |
| **26** | Private| `/account/profile` | Personal Account Info | Authenticated User | Name, avatar upload, email, GSTIN, phone visibility privacy controls (Show/Hide/On-Request). |
| **27** | Private| `/account/ads` | My Ads Dashboard | Authenticated User | Listing tabs (Live, Pending, Expired, Rejected), edit, mark sold, delete, boost ads. |
| **28** | Private| `/account/services` | My Repair Services | Verified Business | Manage repair service offerings, pricing ranges, edit/delete services. |
| **29** | Private| `/account/spare-parts` | My Spare Parts Inventory | Verified Business | Manage component inventory, stock levels, part numbers, edit/delete parts. |
| **30** | Private| `/account/saved` | Saved / Bookmarked Ads | Authenticated User | Bookmarked listings grid, quick chat initiation, remove bookmark. |
| **31** | Private| `/account/messages` | Chat Inbox & Threads | Authenticated User | Active/Archived/Unread inbox views, thread list, unread badges, conversation preview. |
| **32** | Private| `/account/messages/[conversationId]` | Direct Chat Thread | Authenticated Participant| P2P real-time messaging, listing context bar, attachment upload, quick replies, safety alert. |
| **33** | Private| `/account/wallet` | Esparex Wallet & Credits | Authenticated User | Ledger history, balance breakdown (Free, Paid, Spotlight, Top Ad), top-up CTA. |
| **34** | Private| `/account/plans` | Subscription Plans & Packs | Authenticated User | Dynamic ad packs, spotlight credits, feature matrix, Razorpay payment checkout, GST invoice. |
| **35** | Private| `/account/purchases` | Purchase Invoices History | Authenticated User | Order history, transaction IDs, payment methods, download GST tax invoice PDF. |
| **36** | Private| `/account/alerts` | Smart Search & Price Alerts| Authenticated User | Keyword & radius alerts, notification channels (Push/Email/SMS), alert frequency, pause/delete. |
| **37** | Private| `/account/business` | My Business Hub | Authenticated User | Business verification status, performance stats (views/clicks/leads), shop open/close toggle. |
| **38** | Private| `/account/business/apply`| Business Registration & KYC| Verified Phone User | 4-step wizard: Basic details, Shop address, GST/PAN document upload, Storefront photos. |
| **39** | Private| `/business/edit` | Business Profile Editor | Existing Business | Edit business description, operating hours, shop address, contact numbers, logo & banners. |
| **40** | Private| `/account/settings` | Settings & Security | Authenticated User | Notification channel toggles, active sessions, permanent account deletion ("DELETE" prompt). |
| **41** | Private| `/post-ad` | Post General Ad Wizard | User + Available Quota | 2-step wizard: Category/Brand/Model/Condition/Title/Price, Photos upload & Location selector. |
| **42** | Private| `/post-service` | Post Service Wizard | Verified Business | Form config: Service types multi-select, price range, turnaround time, warranty terms. |
| **43** | Private| `/post-spare-part-listing`| Post Spare Part Wizard | Verified Business | Form config: Part type, OEM vs aftermarket origin, target model compatibility, unit price. |
| **44** | Private| `/edit-ad/[id]` | Edit General Ad | Ad Author Only | Edit ad details, photos, pricing, description, re-submit for moderation. |
| **45** | Private| `/edit-service/[id]` | Edit Repair Service | Service Author Only | Edit service pricing, supported devices, description, warranty. |
| **46** | Private| `/edit-spare-part/[id]` | Edit Spare Part | Part Author Only | Edit part specifications, pricing, stock count, photos. |

---

## 3. Section I: Public Pages (Complete Inventory)

### 3.1 Home Page (`/`)
- **Route Path**: `/`
- **File**: `apps/web/src/app/(public)/page.tsx`
- **Layout Shell**: `apps/web/src/app/(public)/layout.tsx` ➔ `CommonLayout`
- **Access Level**: Public (Guests & Authenticated Users)
- **Data Fetching Strategy**: SSR with 60-second ISR revalidation (`export const revalidate = 60;`) and server-side timeouts (`withTimeout(..., 5000)`) to ensure fast Googlebot crawls.
- **SEO & Structured Data**:
  - `Organization` Schema: Legal name, URL, logo, contact points.
  - `WebSite` Schema: Search action URL template.
  - Keyword-rich accessible H1 for screen readers.
- **Key Sub-Components**:
  - `HomeLocationAutoPrompt`: Detects whether user has an active location cookie; prompts to enable browser GPS or select local city.
  - `CategoryBrowser`: Category slider with quick links to `Mobiles`, `Laptops`, `LED TVs`, `Tablets`, `Spare Parts`, etc.
  - `HomeFeed`: Personalized dynamic feed rendering featured, recent, and nearby listings.
  - `AdPlacementSlot`: High-visibility monetized slots (`homepage_hero_top`, `homepage_feed_inline`).
- **User Flows**:
  1. User arrives on homepage. Location auto-prompt checks browser location.
  2. User taps a category chip ➔ navigates to `/category/[category]`.
  3. User scrolls through marketplace feed ➔ infinite scroll loads additional listings.
  4. User clicks any listing card ➔ navigates to `/ads/[slug]`.

---

### 3.2 Search & Browse Marketplace (`/search`)
- **Route Path**: `/search`
- **File**: `apps/web/src/app/(public)/search/page.tsx`
- **Access Level**: Public
- **URL Query Parameters**:
  - `q`: Search keyword string (e.g. `?q=iphone+13+display`)
  - `type`: Marketplace entity type: `ad` (default), `service`, or `spare_part`
  - `category` / `categoryId`: Category slug or 24-character hexadecimal MongoDB ObjectId
  - `modelId`: Hardware model ID
  - `brands`: Selected brand IDs
  - `minPrice` / `maxPrice`: Numeric filter bounds
  - `locationId`: City/Locality entity ID
  - `radiusKm`: Proximity distance slider in km (default: 50km)
  - `sort`: Sorting order (`newest`, `price_asc`, `price_desc`, `popular`)
  - `page`: Pagination index (default: 1)
- **Key Sub-Components**:
  - `BrowseAds`: Container managing search state and data synchronization.
  - `BrowseListingsView`: Dual responsive view (sidebar filter panel on desktop; slide-over filter sheet on mobile).
  - `AdCardGrid` / `AdCardList`: Toggle between responsive multi-column grid and single-column detailed list.
  - `DataTablePagination`: Page traversal control.
- **User Flows**:
  1. User enters keywords or selects filters.
  2. URL query parameters update dynamically with shallow navigation.
  3. Filter drawer on mobile opens via sticky filter button, allowing radius adjustments.
  4. Instant results update without losing scroll position.

---

### 3.3 Category Browse Page (`/category/[category]`)
- **Route Path**: `/category/[category]`
- **File**: `apps/web/src/app/(public)/category/[category]/page.tsx`
- **Dynamic Segment**: `[category]` (e.g. `mobiles`, `laptops`, `tablets`, `accessories`, `televisions`)
- **Access Level**: Public
- **Canonical Slug Redirection**: Enforces canonical URL slugs via `getCanonicalCategorySlug()`. If an alias (e.g. `/category/mobile-phones`) is requested, issues a permanent 308 redirect to `/category/mobiles`.
- **Key Sub-Components**:
  - `ClientCategoryWrapper`: Binds category context and renders category-specific browse view.
  - Breadcrumb navigation: `Home > Categories > [Category Name]`.
- **User Flows**:
  1. User navigates directly or from category banner.
  2. Displays pre-filtered listings matching the target category.
  3. Provides sub-brand filters specific to the chosen category.

---

### 3.4 General Ad / Device Detail (`/ads/[slug]`)
- **Route Path**: `/ads/[slug]`
- **File**: `apps/web/src/app/(public)/ads/[slug]/page.tsx`
- **Dynamic Segment**: `[slug]` format: `[seo-slug]-[listingId]` (e.g. `iphone-13-128gb-starlight-6543210abcdef`)
- **Access Level**: Public
- **SEO & Schema.org**: Renders `Product` Schema.org JSON-LD with price, condition, currency, seller, and availability.
- **Key Sub-Components**:
  - `AdTitlePriceCard`: Title, price in INR, device condition (Brand New, Like New, Good, Fair), posted date, views counter, location.
  - `AdImageCarousel`: High-resolution product images slider with swipe gestures and thumbnail dots.
  - `AdImageLightbox`: Fullscreen zoom lightbox with touch gestures and keyboard Escape handling.
  - `ListingDescriptionCard`: Full seller description, specifications, and working parts breakdown.
  - `AdSellerCard`: Seller public name, member since date, verification badges, response time, link to `/seller/[id]`.
  - `AdBusinessCard`: If posted by a business: store name, GSTIN badge, physical address, business hours, link to `/business/[slug]`.
  - `ListingDetailSidebar`: Desktop action panel with primary CTAs:
    - **Chat with Seller**: Initiates/opens conversation thread.
    - **Show Phone Number**: Reveals seller's masked phone number with click-to-call.
    - **Save Ad**: Bookmarks ad to user's `/account/saved` (prompts login if guest).
    - **Share Ad**: Opens share options.
    - **Report Ad**: Opens abuse dialog.
  - `ListingBottomActions`: Sticky mobile bottom action bar with quick "Chat" and "Call" buttons.
  - `AdOwnerActions`: Displayed only if viewer is the author: Edit Ad (`/edit-ad/[id]`), Mark as Sold, Delete, Boost Ad.
- **User Flows**:
  1. Buyer views photos and specifications.
  2. Buyer clicks "Chat with Seller" ➔ If authenticated, creates/opens `/account/messages/[conversationId]`; if guest, opens Auth Modal and returns on completion.
  3. Buyer clicks "Show Phone Number" ➔ Records lead event and unmasks telephone number.
  4. Buyer clicks "Share" ➔ Opens native share sheet on mobile or copy link modal on desktop.

---

### 3.5 Spare Part Detail Page (`/spare-part-listings/[slug]`)
- **Route Path**: `/spare-part-listings/[slug]`
- **File**: `apps/web/src/app/(public)/spare-part-listings/[slug]/page.tsx`
- **Access Level**: Public
- **Specific Capabilities for Hardware Spare Parts**:
  - Tailored specifically for OEM pulls, refurbished genuine modules, and aftermarket compatible parts.
  - Highlights exact part number (e.g., `OEM-GH82-28499A`), screen technology (OLED / LCD / AMOLED), and connector pin specifications.
  - Model Compatibility Section: Displays full list of smartphone/laptop models verified to work with this part.
  - Stock quantity indicator for wholesale repair technicians.

---

### 3.6 Spare Part Legacy Redirect (`/spare-parts/[slug]`)
- **Route Path**: `/spare-parts/[slug]`
- **File**: `apps/web/src/app/(public)/spare-parts/[slug]/page.tsx`
- **Behavior**: Emits server-side 301 Permanent Redirect to canonical `/spare-part-listings/[slug]`.

---

### 3.7 Browse Spare Parts Redirect (`/browse-spare-parts`)
- **Route Path**: `/browse-spare-parts`
- **File**: `apps/web/src/app/(public)/browse-spare-parts/page.tsx`
- **Behavior**: Emits server-side 301 Permanent Redirect to canonical `/search?type=spare_part`.

---

### 3.8 Services Directory / Landing (`/services`)
- **Route Path**: `/services`
- **File**: `apps/web/src/app/(public)/services/page.tsx`
- **Access Level**: Public
- **Core Capabilities**:
  - Hyper-local directory for electronics repair workshops and certified technicians.
  - Filter by service category: Screen Replacement, Battery Health, Micro-soldering, Water Damage Recovery, Camera Module repair.
  - Distance radius matching based on user's current city/GPS.

---

### 3.9 Service Detail Page (`/services/[slug]`)
- **Route Path**: `/services/[slug]`
- **File**: `apps/web/src/app/(public)/services/[slug]/page.tsx`
- **Access Level**: Public
- **Schema.org**: Emits `Service` Schema with `AggregateOffer` price range.
- **Core Capabilities**:
  - Service price range (`priceMin` to `priceMax`).
  - Repair Turnaround Estimate (e.g. 45-minute express screen repair).
  - Mode of Delivery: In-Shop Walk-In vs Doorstep Technician Pickup.
  - Warranty badge (e.g., "90 Days Warranty on Parts").
  - Technician location map and opening hours.

---

### 3.10 Browse Services Redirect (`/browse-services`)
- **Route Path**: `/browse-services`
- **File**: `apps/web/src/app/(public)/browse-services/page.tsx`
- **Behavior**: Emits server-side 301 Permanent Redirect to `/services`.

---

### 3.11 Brand Catalog Page (`/brands/[slug]`)
- **Route Path**: `/brands/[slug]`
- **File**: `apps/web/src/app/(public)/brands/[slug]/page.tsx`
- **Dynamic Segment**: `[slug]` (e.g. `apple`, `samsung`, `xiaomi`, `oneplus`)
- **Core Capabilities**:
  - Resolves brand entity from master catalog data.
  - Emits breadcrumb: `Home > Brands > [Brand Name]`.
  - Displays grid of models associated with this brand.
  - Displays live marketplace listings filtered by this brand.

---

### 3.12 Model Catalog Page (`/models/[slug]`)
- **Route Path**: `/models/[slug]`
- **File**: `apps/web/src/app/(public)/models/[slug]/page.tsx`
- **Dynamic Segment**: `[slug]` (e.g. `iphone-14-pro-max`, `galaxy-s23-ultra`)
- **Core Capabilities**:
  - Displays official OEM model hardware specs (Screen size, battery capacity, release year).
  - Surfaces active user listings for this exact device.
  - Surfaces compatible replacement spare parts (screens, charging ports, back glass).

---

### 3.13 Business Directory Redirect (`/business`)
- **Route Path**: `/business`
- **File**: `apps/web/src/app/(public)/business/page.tsx`
- **Behavior**: Emits server-side 301 Permanent Redirect to `/`.

---

### 3.14 Public Business Storefront (`/business/[slug]`)
- **Route Path**: `/business/[slug]`
- **File**: `apps/web/src/app/(public)/business/[slug]/page.tsx`
- **Dynamic Segment**: `[slug]` format: `[business-slug]-[businessId]`
- **Schema.org**: Emits `LocalBusiness` Schema with telephone, logo, and physical address.
- **Key Sub-Components**:
  - `BusinessHeaderCard`: Store banner, logo, business name, verified GST shield, rating.
  - `BusinessSidebarCard`: Physical shop address, operating hours, direct phone, WhatsApp link, website.
  - `BusinessCatalogTabs`:
    - **Ads Tab**: Classified device listings posted by this store.
    - **Services Tab**: Repair services offered by this shop.
    - **Spare Parts Tab**: Loose hardware component inventory.

---

### 3.15 Public Seller Profile (`/seller/[id]`)
- **Route Path**: `/seller/[id]`
- **File**: `apps/web/src/app/(public)/seller/[id]/page.tsx`
- **Dynamic Segment**: `[id]` format: `[seller-name]-[userId]`
- **Core Capabilities**:
  - Public profile for individual peer-to-peer sellers.
  - Shows verified phone status, account creation date, and trust ratings.
  - Grid of all currently active listings posted by the seller.

---

### 3.16 How It Works (`/how-it-works`)
- **Route Path**: `/how-it-works`
- **File**: `apps/web/src/app/(public)/how-it-works/page.tsx`
- **Core Capabilities**:
  - Structured 3-step walkthrough for:
    1. **Buyers**: Finding exact parts via structured catalog & negotiating in chat.
    2. **Sellers**: Posting ads in under 60 seconds, hyper-local radius matching, spotlight boost.
    3. **Technicians**: Listing specialized repair services and walk-in workshops.

---

### 3.17 About Us (`/about`)
- **Route Path**: `/about`
- **File**: `apps/web/src/app/(public)/about/page.tsx`
- **Core Capabilities**:
  - Platform mission statement on organizing India's fragmented aftermarket electronics industry.
  - Transparency, quality assurance, and e-waste reduction values.

---

### 3.18 Contact Us & Grievance Redressal (`/contact`)
- **Route Path**: `/contact`
- **File**: `apps/web/src/app/(public)/contact/page.tsx`
- **Core Capabilities**:
  - Customer support email (`support@esparex.in`) and telephone helpline.
  - B2B wholesale and corporate partnership desk.
  - Statutory Grievance Redressal Officer disclosures compliant with India's Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules and Consumer Protection (E-Commerce) Rules.

---

### 3.19 Help Center & FAQ (`/faq`)
- **Route Path**: `/faq`
- **File**: `apps/web/src/app/(public)/faq/page.tsx`
- **Core Capabilities**:
  - 8 searchable, accessible accordion modules covering:
    - Account & Registration
    - Buying & Finding Spare Parts
    - Selling, Posting Ads & Listings
    - Repair Services & Technicians
    - Business Profiles & Wholesalers
    - Plans, Wallet & Payments
    - Trust, Safety & Reporting
    - Grievance Redressal & Legal Contacts

---

### 3.20 Trust & Safety Guidelines (`/safety-tips`)
- **Route Path**: `/safety-tips`
- **File**: `apps/web/src/app/(public)/safety-tips/page.tsx`
- **Core Capabilities**:
  - Golden rules for buyers: Never send advance money, inspect goods in person, verify screen connectors before purchase.
  - Golden rules for sellers: Avoid suspicious courier pickup requests, verify UPI payment confirmation in own banking app.
  - Hardware component testing checklist (Testing touch digitizers, checking battery cycles, inspecting motherboard corrosion).

---

### 3.21 Terms of Service (`/terms`)
- **Route Path**: `/terms`
- **File**: `apps/web/src/app/(public)/terms/page.tsx`
- **Core Capabilities**:
  - Prohibited items policy (stolen devices, iCloud/activation-locked phones, blacklisted IMEI items).
  - Platform role as an intermediary marketplace under Section 79 of the IT Act.
  - Fee policies, listing moderation rules, and termination terms.

---

### 3.22 Privacy Policy (`/privacy`)
- **Route Path**: `/privacy`
- **File**: `apps/web/src/app/(public)/privacy/page.tsx`
- **Core Capabilities**:
  - User data collection details (mobile number, location coordinates, chat messages).
  - Privacy controls: Explains "Mobile Number Visibility" settings (Show / Hide / On-Request).
  - Instructions on exercising data erasure and permanent account deletion.

---

### 3.23 HTML Sitemap (`/site-map`)
- **Route Path**: `/site-map`
- **File**: `apps/web/src/app/(public)/site-map/page.tsx`
- **Core Capabilities**: Comprehensive human-readable tree of all main public landing pages, categories, and policy documents.

---

### 3.24 Unauthorized Access Notice (`/unauthorized`)
- **Route Path**: `/unauthorized`
- **File**: `apps/web/src/app/(public)/unauthorized/page.tsx`
- **Core Capabilities**: Friendly access denial boundary when a standard user attempts to access administrative or restricted features. Includes button to return home or switch accounts.

---

### 3.25 PWA Offline Fallback (`/offline`)
- **Route Path**: `/offline`
- **File**: `apps/web/src/app/offline/page.tsx`
- **Core Capabilities**: Intercepted by Service Worker when network connectivity is lost. Features system-fallback fonts, clear offline status indicator, and reconnect reload button.

---

## 4. Section II: Private & Authenticated Pages (Complete Inventory)

All private pages are enclosed within the `apps/web/src/app/(private)` layout and guarded by `src/proxy.ts` middleware and `AuthGuard.tsx`.

### 4.1 User Profile & Account Info (`/account/profile`)
- **Route Path**: `/account/profile`
- **File**: `apps/web/src/app/(private)/account/profile/page.tsx`
- **Account Shell Tab**: `personal`
- **Guard**: `requireUserAuth` (Redirects to login modal with callback URL if unauthenticated)
- **Key Sub-Components**:
  - `PersonalTab`: Profile manager layout.
  - `PersonalProfileEmailSection`: Add/update email address for transactional receipts.
  - `PersonalProfileGstSection`: Optional GSTIN entry for tax deductions.
  - `PersonalProfileMobileVisibilitySection`: Privacy toggle:
    - `Show`: Phone number visible to all potential buyers.
    - `Hide`: Phone hidden; all inquiries routed through Esparex chat.
    - `On-Request`: Buyers must explicitly request phone access inside chat.
  - Avatar uploader with direct image preview.
  - Unsaved changes dirty state detection.

---

### 4.2 My Ads / Listings Dashboard (`/account/ads`)
- **Route Path**: `/account/ads`
- **File**: `apps/web/src/app/(private)/account/ads/page.tsx`
- **Account Shell Tab**: `mylistings` (sub-tab: `ads`)
- **URL Query**: `?status=all|live|pending|expired|rejected`
- **Core Capabilities**:
  - Status counts badge indicators (e.g. 5 Live, 1 Pending Moderation).
  - Status filter tabs:
    - **Live**: Currently searchable on marketplace.
    - **Pending**: Under admin safety review.
    - **Expired**: Past 30-day listing lifetime.
    - **Rejected**: Moderation rejection with specific policy feedback note.
  - Per-ad action menu:
    - View Live Ad
    - Edit Ad (`/edit-ad/[id]`)
    - Mark as Sold / Deactivate
    - Delete Listing (triggers confirmation dialog)
    - Boost / Promote Listing (opens `BoostPlanCards` dialog)
  - Primary "+ Post Ad" CTA button.

---

### 4.3 My Repair Services (`/account/services`)
- **Route Path**: `/account/services`
- **File**: `apps/web/src/app/(private)/account/services/page.tsx`
- **Account Shell Tab**: `mylistings` (sub-tab: `services`)
- **Guard**: `requireBusinessAuth` (Restricted to verified business accounts)
- **Core Capabilities**:
  - View all registered repair service offerings.
  - Service operational indicators.
  - Edit service specifications (`/edit-service/[id]`).
  - Delete or pause service availability.
  - "+ Post Service" CTA button (`/post-service`).

---

### 4.4 My Spare Parts Inventory (`/account/spare-parts`)
- **Route Path**: `/account/spare-parts`
- **File**: `apps/web/src/app/(private)/account/spare-parts/page.tsx`
- **Account Shell Tab**: `mylistings` (sub-tab: `spare-parts`)
- **Guard**: `requireBusinessAuth` (Restricted to verified business accounts)
- **Core Capabilities**:
  - Specialized component inventory grid.
  - Displays stock count, OEM part numbers, and price per unit.
  - Edit spare part (`/edit-spare-part/[id]`).
  - "+ Post Spare Part" CTA button (`/post-spare-part-listing`).

---

### 4.5 Saved / Favorite Ads (`/account/saved`)
- **Route Path**: `/account/saved`
- **File**: `apps/web/src/app/(private)/account/saved/page.tsx`
- **Account Shell Tab**: `saved`
- **Core Capabilities**:
  - Displays all items bookmarked by the user across search and detail pages.
  - Instant "Chat with Seller" shortcut from card.
  - Remove from saved bookmarks button.
  - Empty state with link to `/search`.

---

### 4.6 Messages & Chat Inbox (`/account/messages`)
- **Route Path**: `/account/messages`
- **File**: `apps/web/src/app/(private)/account/messages/page.tsx`
- **Account Shell Tab**: `messages`
- **URL Query**: `?view=active|archived|unread`
- **Key Sub-Components**:
  - `AccountMessagesWorkspace`: Split view layout on desktop (`320px` sidebar + main chat viewport).
  - `ChatList`: Thread list with participant avatar, listing title, unread counter badge, and last message snippet.
  - Search conversations bar.
  - View filter tabs: **Active**, **Archived**, **Unread**.

---

### 4.7 Direct Chat Conversation Thread (`/account/messages/[conversationId]`)
- **Route Path**: `/account/messages/[conversationId]`
- **File**: `apps/web/src/app/(private)/account/messages/[conversationId]/page.tsx`
- **Dynamic Segment**: `[conversationId]`
- **Key Sub-Components**:
  - `ConversationView`: Embedded chat workspace.
  - Sticky Listing Header: Thumbnail, ad title, price, and link to listing.
  - Message bubble list with sent, delivered, and read receipt timestamps.
  - Anti-scam warning card at the top of the chat.
  - Quick-reply chips ("Is this still available?", "Can you do ₹X?", "Where can we meet?").
  - File/photo attachment upload button.
  - Options menu: Archive conversation, Block user, Report seller.

---

### 4.8 Esparex Wallet & Credits (`/account/wallet`)
- **Route Path**: `/account/wallet`
- **File**: `apps/web/src/app/(private)/account/wallet/page.tsx`
- **Account Shell Tab**: `plans` (Initial sub-tab: `OVERVIEW`)
- **Key Sub-Components**:
  - `WalletOverviewCard`: Available rupee balance and available credits.
  - Credit breakdown:
    - **Free Ad Slots**: Remaining monthly quota.
    - **Paid Ad Credits**: Prepaid listing slots.
    - **Spotlight Credits**: Pinned homepage promotions.
    - **Top Ad Credits**: Category boost credits.
  - `ActiveSubscriptionCard`: Current tier (e.g. Free, Pro Seller, Enterprise) and expiry date.
  - `CreditLedgerHistoryCard`: Detailed timestamped ledger of credits purchased and debited.

---

### 4.9 Subscription Plans & Ad Packs (`/account/plans`)
- **Route Path**: `/account/plans`
- **File**: `apps/web/src/app/(private)/account/plans/page.tsx`
- **Account Shell Tab**: `buyplans` (Initial sub-tab: `BUY_PLANS`)
- **Core Capabilities**:
  - Plan category selector:
    - **More Ads**: Bundles of 5, 10, or 25 ad slots.
    - **Spotlight**: 7-day or 14-day homepage pinned banners.
    - **Top Ad**: Top of category search rankings.
    - **Alert Slots**: Additional saved search alert slots.
  - `DynamicPlanCard`: Pricing, duration, benefit checklist.
  - `PlanPurchaseDialog`: Secure checkout modal with Razorpay integration and optional GST invoicing fields.

---

### 4.10 Purchase History & Invoices (`/account/purchases`)
- **Route Path**: `/account/purchases`
- **File**: `apps/web/src/app/(private)/account/purchases/page.tsx`
- **Account Shell Tab**: `purchases` (Initial sub-tab: `INVOICES`)
- **Core Capabilities**:
  - List of all completed payment transactions.
  - Order ID, date, plan name, amount paid, and payment method.
  - `InvoicePreviewDialog`: View detailed GST breakdown (CGST, SGST, IGST).
  - Download official tax invoice PDF.

---

### 4.11 Smart Search & Price Alerts (`/account/alerts`)
- **Route Path**: `/account/alerts`
- **File**: `apps/web/src/app/(private)/account/alerts/page.tsx`
- **Account Shell Tab**: `smartalerts`
- **Key Sub-Components**:
  - `SmartAlertsTab`: Alert management dashboard.
  - `CreateSmartAlertDialog`:
    - Search keywords.
    - Category, Brand, and Model selections.
    - Maximum price threshold.
    - Location and radius proximity slider (5km to 100km).
    - Delivery channels: Push notifications, Email, SMS.
    - Notification frequency: Instant alert vs Daily digest.
  - Toggle alert on/off.
  - "View Matches" button to instantly run the alert query in `/search`.
  - Delete alert action.

---

### 4.12 My Business Hub (`/account/business`)
- **Route Path**: `/account/business`
- **File**: `apps/web/src/app/(private)/account/business/page.tsx`
- **Account Shell Tab**: `business`
- **Core Capabilities**:
  - Business Verification Status: Displays status badge (**Pending Review**, **Approved / Live**, **Action Required / Rejected**, **Suspended**).
  - Business Analytics: Total impressions, listing clicks, customer phone inquiry count.
  - Operating status toggle (Open vs Temporarily Closed).
  - Quick link to public business storefront (`/business/[slug]`).
  - Button to edit business details (`/business/edit`).
  - License renewal prompt when subscription approaches expiration.

---

### 4.13 Business Registration & KYC Application (`/account/business/apply`)
- **Route Path**: `/account/business/apply`
- **File**: `apps/web/src/app/(private)/account/business/apply/page.tsx`
- **Guard**: Requires verified mobile number. If unverified, directs user to `/account/profile` first.
- **4-Step Registration Flow**:
  - **Step 1: Basic Business Details**: Shop/Company name, Legal entity type (Sole Proprietorship, Partnership, LLP, Private Limited), Business description, Support mobile & email.
  - **Step 2: Shop Address & Location**: Physical street address, Pincode, City, State, and exact GPS coordinates on map.
  - **Step 3: Statutory KYC Documents**: Upload GSTIN Certificate PDF/Image, Business PAN, Shop & Establishment License.
  - **Step 4: Storefront & Branding**: Upload store logo and physical shop entrance photos.
- **Post-Submission Status**:
  - Renders `BusinessApplicationStatus` tracker with real-time moderation status and administrative notes if documents need revision.

---

### 4.14 Business Profile Editor (`/business/edit`)
- **Route Path**: `/business/edit`
- **File**: `apps/web/src/app/(private)/business/edit/page.tsx`
- **Guard**: Must have an existing registered business profile. Suspended accounts are blocked.
- **Core Capabilities**:
  - Update store contact numbers, support email, and website.
  - Update business hours and working days.
  - Replace storefront cover photos and logo.
  - Update shop address or service radius.

---

### 4.15 Account Settings & Security (`/account/settings`)
- **Route Path**: `/account/settings`
- **File**: `apps/web/src/app/(private)/account/settings/page.tsx`
- **Account Shell Tab**: `settings`
- **Core Capabilities**:
  - Notification preference checkboxes (Chat notifications, Price alerts, Promotional SMS, Marketing emails).
  - Review active browser sessions.
  - `DeleteAccountDialog`: Permanent account deletion procedure:
    - Requires typing `DELETE` in confirmation prompt.
    - Immediately unpublishes all active listings.
    - Terminates all active sessions and purges user credentials.

---

### 4.16 Post Ad Wizard (`/post-ad`)
- **Route Path**: `/post-ad`
- **File**: `apps/web/src/app/(private)/post-ad/page.tsx`
- **Guard**: Verifies posting balance via `/api/v1/users/posting-balance`. If balance is 0, renders quota exhausted screen with direct link to buy Ad Packs at `/account/plans`.
- **2-Step Wizard Architecture**:
  - **Step 1: Listing Information**:
    - Select Category: `Mobiles`, `Laptops`, `LED TVs`, `Tablets`, `Accessories`, etc.
    - Select Brand: Hierarchically filtered based on category.
    - Select Model: Filtered based on brand.
    - Device Condition: `Brand New`, `Like New`, `Good`, `Fair`, `Needs Repair`.
    - Listing Title: Auto-prefilled with Brand + Model; editable with real-time character counters.
    - Asking Price: Price in INR with numerical format validation.
    - Description: Details on device history, battery health, scratches, included accessories.
  - **Step 2: Listing Details**:
    - Photo Uploader: Multi-image picker, drag-and-drop, photo reordering, delete, cover photo badge.
    - Location Selector: GPS auto-locate or manual City/Locality picker.
    - Phone Number Privacy: "Show phone" vs "Hide phone (Chat only)".
  - **Submission & Success**:
    - Client validates payload with `AdPayloadSchema` from `@esparex/contracts`.
    - Dispatches to `POST /api/v1/listings`.
    - Displays `ListingSubmissionSuccessModal` with options to "View Pending Ads" or "Go to Homepage".

---

### 4.17 Post Repair Service Wizard (`/post-service`)
- **Route Path**: `/post-service`
- **File**: `apps/web/src/app/(private)/post-service/page.tsx`
- **Guard**: `requireBusinessAuth` & `BusinessListingGatePage` (Only admin-approved business sellers can post services).
- **Core Capabilities**:
  - Select device category (e.g. Smartphones, Laptops).
  - Select supported brands.
  - Select service types (Screen replacement, Battery swap, Micro-soldering, Water damage repair).
  - Enter price range (`priceMin` and `priceMax`).
  - Turnaround time and warranty period terms.

---

### 4.18 Post Spare Part Wizard (`/post-spare-part-listing`)
- **Route Path**: `/post-spare-part-listing`
- **File**: `apps/web/src/app/(private)/post-spare-part-listing/page.tsx`
- **Guard**: `requireBusinessAuth` & `BusinessListingGatePage`.
- **Core Capabilities**:
  - Dedicated form for hardware component inventory.
  - Select Spare Part Type: Display Assembly, Battery, Charging Flex, Motherboard, Camera Module.
  - Part Origin / Grade: OEM Pull, Refurbished Original, High-Quality Aftermarket.
  - Stock quantity, unit price, and minimum order quantity.

---

### 4.19 Edit General Ad (`/edit-ad/[id]`)
- **Route Path**: `/edit-ad/[id]`
- **File**: `apps/web/src/app/(private)/edit-ad/[id]/page.tsx`
- **Guard**: Must be the authenticated owner of listing `[id]`.
- **Core Capabilities**: Pre-populates existing ad information in `PostAdWizard` in `editMode`. Allows modifying price, photos, description, and re-submitting.

---

### 4.20 Edit Repair Service (`/edit-service/[id]`)
- **Route Path**: `/edit-service/[id]`
- **File**: `apps/web/src/app/(private)/edit-service/[id]/page.tsx`
- **Guard**: `requireBusinessAuth` & service owner.
- **Core Capabilities**: Edit service description, pricing, warranty terms, and active status.

---

### 4.21 Edit Spare Part Listing (`/edit-spare-part/[id]`)
- **Route Path**: `/edit-spare-part/[id]`
- **File**: `apps/web/src/app/(private)/edit-spare-part/[id]/page.tsx`
- **Guard**: `requireBusinessAuth` & spare part owner.
- **Core Capabilities**: Update stock count, price per unit, condition, and photos.

---

## 5. Section III: Global Modals, Floating Overlays & Cross-Cutting Flows

### 5.1 Passwordless OTP Authentication Modal Flow
- **Component**: `apps/web/src/components/auth/AuthModal.tsx` & `LoginFlow.tsx`
- **Trigger**: Click "Login" in header, or trigger any protected action while unauthenticated ("Post Ad", "Save Ad", "Chat with Seller", "Make Offer").
- **Steps**:
  1. **Mobile Step (`LoginMobileStep`)**:
     - User enters 10-digit Indian phone number (`+91`).
     - Real-time regex validation (`/^[6-9]\d{9}$/`).
     - User accepts Terms and Privacy Policy.
     - Submits to `POST /api/v1/auth/request-otp`.
  2. **OTP Verification Step (`LoginOtpStep`)**:
     - 6-box auto-focusing numeric OTP input.
     - 60-second cooldown timer for "Resend OTP".
     - Submits to `POST /api/v1/auth/verify-otp`.
     - On success: Issues JWT session cookies, updates `AuthContext`, and redirects seamlessly back to the triggering page via `callbackUrl`.

---

### 5.2 Hyper-Local Geolocation & Manual Location Selector
- **Component**: `apps/web/src/components/location/LocationSelector.tsx` & `LocationOverlayHost.tsx`
- **Trigger**: Click Location pill in Header, or location selector button in search filters and post-ad forms.
- **Capabilities**:
  - **Auto-Detect GPS**: Requests browser Geolocation coordinates; reverse-geocodes coordinates via `/api/v1/locations/reverse`.
  - **Hierarchy Search**: Search any Indian State ➔ District ➔ City ➔ Locality.
  - **Popular Cities Grid**: 1-tap quick buttons for major metropolitan areas (Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, etc.).
  - Persists selection to cookies (`esparex_loc`) and React context.

---

### 5.3 Listing Promotion & Spotlight Boost Modal
- **Component**: `apps/web/src/components/user/boost/BoostPlanCards.tsx`
- **Trigger**: Click "Boost Ad" on any active listing in `/account/ads` or `/ads/[slug]`.
- **Options**:
  - **Spotlight Ad**: Pins ad to top banner of the Homepage and Search results with gold badge.
  - **Top Ad**: Ranks ad at the top of category browse results.
- **Flow**: Immediate deduction from user's credit balance; if insufficient credits, presents checkout modal to purchase credits via Razorpay.

---

### 5.4 Listing Abuse & Fraud Reporting Dialog
- **Component**: `apps/web/src/components/user/listing-detail/ListingDetailDialogs.tsx`
- **Trigger**: Click "Report Ad" on any listing page.
- **Categories**:
  - Counterfeit / Fake Item
  - Fraud / Scam Suspected
  - Prohibited Item (Stolen, Activation-Locked)
  - Inaccurate Specifications / Wrong Photos
  - Offensive or Abusive Content
- **Submission**: Sends ticket to admin moderation queue with reporter ID and ad snapshot.

---

### 5.5 Social Sharing & Web Share API Drawer
- **Trigger**: Click "Share" icon on any Ad, Service, Spare Part, or Business storefront.
- **Behavior**:
  - On mobile browsers supporting `navigator.share`: Invokes native OS share sheet.
  - On desktop: Opens modal with direct 1-tap WhatsApp share, Facebook, X (Twitter), and "Copy Link" to clipboard with toast feedback.

---

### 5.6 Unsaved Changes Form Guard Dialog
- **Component**: `@esparex/ui` `UnsavedChangesDialog`
- **Trigger**: When editing user profile (`/account/profile`) or wizard forms (`/post-ad`), if user attempts to switch tabs or navigate away while inputs are dirty.
- **Actions**: "Discard Changes" (confirms navigation) vs "Keep Editing" (cancels navigation).

---

## 6. Section IV: System, Error & SEO Edge Handlers

| Route / File | Type | Capability & Behavior |
|---|---|---|
| `apps/web/src/app/not-found.tsx` | 404 Handler | Accessible 404 page with search suggestion links and return to homepage button. |
| `apps/web/src/app/error.tsx` | Client Error Boundary | Catches runtime UI errors, reports to logger, provides "Try Again" recovery button. |
| `apps/web/src/app/global-error.tsx` | Root Error Boundary | Root HTML/body crash boundary with minimal CSS fallback styling. |
| `apps/web/src/app/robots.ts` | Robots Directive | Generates dynamic `/robots.txt` disallowing `/account/*`, `/admin/*`, and allowing public browse routes. |
| `apps/web/src/app/sitemap.ts` | Dynamic Sitemap | Generates `/sitemap.xml` listing static pages, categories, and top live listings. |
| `apps/web/src/app/api/upload/ad-image/route.ts` | API Route Handler | Next.js server route handling authenticated multipart image uploads to S3/Cloudinary. |
| `apps/web/src/app/internal/revalidate/route.ts` | On-Demand ISR | Webhook handler triggered on listing updates to revalidate cached Next.js paths. |

---

*End of Esparex User-Facing Frontend Specification & Route Inventory.*
