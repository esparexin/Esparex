# Esparex Android (Mobile) UI & UX Master Checklist

> **Purpose**: Single dedicated task list for tracking implementation, UI refinement, and UX verification across all Android / React Native screens in `apps/mobile`.

---

## 🔐 1. Authentication Stack (`AuthNavigator`) — ✅ **COMPLETED**

- [x] **Login Screen** (`apps/mobile/src/features/auth/screens/LoginScreen.tsx`)
  - [x] Brand Header & Logo layout alignment
  - [x] Phone input formatting (+91 prefix, 10-digit validation)
  - [x] Terms & Privacy Policy interactive link navigation
  - [x] "Send OTP" primary action CTA (disabled state until valid phone number)
  - [x] KeyboardAvoidingView / smooth scroll on focus
  - [x] Accessible touch targets (`min-h-[48px]`, screen reader labels)

- [x] **OTP Verification Screen** (`apps/mobile/src/features/auth/screens/OTPScreen.tsx`)
  - [x] 6-digit segmented OTP input cells (`SegmentedOtpInput`)
  - [x] Auto-focus next cell on keypress
  - [x] Clipboard paste & SMS OTP auto-fill support
  - [x] Countdown timer for "Resend OTP"
  - [x] Mobile number edit / back button with `cancelOtp`
  - [x] Invalid OTP error shake animation & state
  - [x] Auto-redirection upon verification

---

## 🏠 2. Home & Marketplace (`MarketplaceScreen`) — ✅ **COMPLETED**

- [x] **Marketplace Feed & Layout** (`apps/mobile/src/features/listings/presentation/screens/MarketplaceScreen.tsx`)
  - [x] Header with Location selector trigger & Notification bell with unread badge
  - [x] Pull-to-refresh listings stream
  - [x] Sticky category pills (`CategoryChips`)
  - [x] Sort & quick filter chips (`FilterBar`)
  - [x] 2-column masonry / FlashList listing cards (`ListingCard`)
  - [x] Optimistic bookmark / favorite heart toggle
  - [x] Zero layout shift loading skeleton (`ListingSkeleton`)
  - [x] Empty state & Error retry boundary (`EmptyState`, `ErrorState`)

- [x] **Location Selector Modal** (`apps/mobile/src/features/listings/presentation/components/LocationSelectorModal.tsx`)
  - [x] City / Area search input with debounce
  - [x] "Use Current Location" GPS trigger / network IP detection
  - [x] Popular cities quick-select chips (Hyderabad, Bengaluru, Mumbai, Delhi, Chennai, Pune, Kolkata)
  - [x] State & City selector
  - [x] All India fallback & radius filtering support

---

## 🔍 3. Search & Discovery (`SearchScreen`) — ✅ **COMPLETED**

- [x] **Search Screen** (`apps/mobile/src/features/listings/presentation/screens/SearchScreen.tsx`)
  - [x] Instant search query input with clear (`X`) button
  - [x] Recent searches history list with tap-to-search & "Clear All"
  - [x] Trending keywords & popular category recommendations
  - [x] Category chips quick-toggle
  - [x] Search results grid with pagination / infinite scroll (`FlatList`)

- [x] **Filter Bottom Sheet Modal** (`apps/mobile/src/features/listings/presentation/components/FilterModal.tsx`)
  - [x] Price range Min-Max numeric inputs
  - [x] Device condition selector pills (Brand New, Like New, Good, Fair)
  - [x] "Verified Business Only" toggle switch (`verifiedOnly`)
  - [x] Sort options (Newest First, Price: Low to High, Price: High to Low, Trending)
  - [x] Active filter chips bar (`FilterBar`) with removable tags & counter
  - [x] "Reset Filters" action button

---

## 📝 4. Post Ad 3-Step Wizard (`PostAdScreen`) — ✅ **COMPLETED**

- [x] **Step 1: Category Selection** (`apps/mobile/src/features/postAd/presentation/steps/StepCategory.tsx`)
  - [x] Visual category cards grid (`CategoryCard`)
  - [x] Stepper indicator (`WizardProgress` Step 1 of 3)
  - [x] Brand & Model searchable dropdown with custom propose fallback
  - [x] Device Condition toggle (Power On vs Power Off)
  - [x] Working / Available Spare Parts multi-select chips

- [x] **Step 2: Details & Pricing** (`apps/mobile/src/features/postAd/presentation/steps/StepDetails.tsx`)
  - [x] Brand & Model search combobox (`BrandModelSection`)
  - [x] Condition selector (`DeviceConditionSection`)
  - [x] Spare Parts checklist (`SparePartsSection`)
  - [x] Price input with Free toggle (`PriceField`)
  - [x] Title & Description fields with AI Auto-fill assistants (`TitleField`, `DescriptionField`)
  - [x] Location picker & GPS auto-detect integration (`LocationField`)
  - [x] Step navigation validation (`WizardNavBar` Back/Next)

- [x] **Step 3: Media & Publishing** (`apps/mobile/src/features/postAd/presentation/steps/StepImages.tsx`)
  - [x] Camera capture & Photo gallery multi-picker (`ImagePickerComponents`)
  - [x] Thumbnail preview grid
  - [x] Cover photo ("Primary Image") selector badge
  - [x] Delete image action with alert confirmation
  - [x] Upload progress indicator & presigned URL direct upload
  - [x] Final "Publish Ad" primary CTA & draft cleanup

---

## 💬 5. Chat & Real-Time Messaging (`ChatNavigator`) — ✅ **COMPLETED**

- [x] **Conversation List Screen** (`apps/mobile/src/features/chat/presentation/screens/ConversationListScreen.tsx`)
  - [x] Search conversations bar with real-time text filter
  - [x] Conversation rows (Avatar, Store/User Name, Listing thumbnail snippet, Last message preview, Timestamp)
  - [x] Unread message counter badge (`99+` support)
  - [x] Pull-to-refresh conversation list
  - [x] Empty state & anonymous user sign-in prompt

- [x] **Chat Thread Screen** (`apps/mobile/src/features/chat/presentation/screens/ChatThreadScreen.tsx`)
  - [x] Message bubble stream (Buyer vs Seller visual distinction)
  - [x] Message status receipts (`MobileChatMessageReceipt`: Sent, Delivered, Read, Failed Retry)
  - [x] Quick reply chips ("Is this still available?", "What's your best price?", "Where is the item located?")
  - [x] KeyboardAvoidingView behavior without jump glitches
  - [x] Input bar with send button & optimistic messaging

---

## 👤 6. Profile, Business & Settings (`ProfileNavigator`) — ✅ **COMPLETED**

- [x] **Profile Overview Screen** (`apps/mobile/src/features/user/presentation/screens/ProfileScreen.tsx`)
  - [x] Header with user avatar, name, verification badge, and contact details
  - [x] Categorized menu sections (`ProfileMenuSection`: My Activity, Business & Plans, Preferences & Legal)
  - [x] Guest fallback card with Sign In / Register CTA
  - [x] Pull-to-refresh profile data

- [x] **My Listings Screen** (`apps/mobile/src/features/listings/presentation/screens/MyListingsScreen.tsx`)
  - [x] Status tabs (`All`, `Live`, `Pending`, `Sold`, `Expired`, `Draft`)
  - [x] Infinite scrolling pagination & pull-to-refresh
  - [x] Tap to navigate to listing details

- [x] **Edit Listing Screen** (`apps/mobile/src/features/listings/presentation/screens/EditListingScreen.tsx`)
  - [x] Pre-filled form with current title, price, and description
  - [x] Validation checks for required fields and non-negative price
  - [x] Optimistic update mutation handling

- [x] **Saved Ads Screen** (`apps/mobile/src/features/listings/presentation/screens/SavedAdsScreen.tsx`)
  - [x] Bookmarked listing card grid
  - [x] 1-tap toggle favorite heart action
  - [x] Empty state with "Explore Marketplace" navigation

- [x] **Business Registration Wizard** (`apps/mobile/src/features/business/presentation/screens/BusinessRegistrationWizardScreen.tsx`)
  - [x] Step 1: Business Info (`StepBusinessInfo` - Store name, Mobile, Email, GSTIN)
  - [x] Step 2: Location Details (`StepLocationDetails` - Address, City, State, Pincode)
  - [x] Step 3: Document Uploads (`StepDocumentsUpload` - Shop License, ID Proof)
  - [x] Step 4: Review & Submit (`StepBusinessReview`)

- [x] **Business Status Screen** (`apps/mobile/src/features/business/presentation/screens/BusinessStatusScreen.tsx`)
  - [x] Status banners (`Pending Verification`, `Verified Business`, `Application Rejected`)
  - [x] Rejection reason feedback display & "Update Application" CTA
  - [x] Edit action for active/live businesses to update contact info, address & store details

- [x] **Edit Business Profile Flow** (`apps/mobile/src/features/business/presentation/screens/BusinessRegistrationWizardScreen.tsx`)
  - [x] Pre-filled multi-step form with existing business info and location details
  - [x] `ApiBusinessRepository.updateBusiness()` integration with `PATCH /api/v1/businesses/:id`

- [x] **Plans & Subscription Screen** (`apps/mobile/src/features/payment/presentation/screens/PlanSelectionScreen.tsx`)
  - [x] Plan tier cards & wallet balance summary
  - [x] Razorpay checkout integration with success alerts

- [x] **Transaction History Screen** (`apps/mobile/src/features/payment/presentation/screens/TransactionHistoryScreen.tsx`)
  - [x] Purchase history list with amount, date, and status chips (`SUCCESS` / `PENDING`)

- [x] **Smart Alerts Screen** (`apps/mobile/src/features/smartAlert/presentation/screens/SmartAlertsScreen.tsx`)
  - [x] Active alerts list with criteria overview (Keywords, Category, Location)
  - [x] Create Smart Alert modal (`CreateSmartAlertModal`)
  - [x] Delete alert confirmation dialog

- [x] **Settings Screen** (`apps/mobile/src/features/user/presentation/screens/SettingsScreen.tsx`)
  - [x] Account info card with quick edit modal (`EditProfileModal`)
  - [x] Push notification toggle switch
  - [x] Sign Out action with confirmation dialog

- [x] **Terms & Privacy Screen** (`apps/mobile/src/features/user/presentation/screens/TermsAndPrivacyScreen.tsx`)
  - [x] Standardized header with `AppIcon` & semantic design tokens
  - [x] Statutory compliance sections (Intermediary role, 18+ eligibility, safety tips, prohibited items, grievance redressal)

---

## 🔎 7. Product Detail Screen (`ListingDetailsScreen`) — ✅ **COMPLETED**

- [x] **Listing Details Screen** (`apps/mobile/src/features/listings/presentation/screens/ListingDetailsScreen.tsx`)
  - [x] Full-width image gallery swipe with pagination dots (`ImageCarousel`)
  - [x] Fullscreen lightbox image zoom view & share action
  - [x] Price & currency formatting (`PriceSection`)
  - [x] Description & attributes overview (`DescriptionSection`)
  - [x] Spare parts component breakdown (`AvailableSparePartsSection`)
  - [x] Nearby verified repair shops (`NearbyRepairServicesSection`)
  - [x] Seller profile card & verified badge (`SellerSection`)
  - [x] In-person transaction safety tips (`SafetyTipsSection`)
  - [x] Floating sticky action bar (`ActionBar`: Dynamic Edit for Owner vs Call/Chat for Buyer)
  - [x] Report ad modal drawer (`ReportAdModal`)

---

## 🔔 8. Notifications Screen (`NotificationScreen`) — ✅ **COMPLETED**

- [x] **Notifications Hub** (`apps/mobile/src/features/notifications/presentation/screens/NotificationScreen.tsx`)
  - [x] Notification list stream with categorized icons (Chat, Ad status, Price drop, Smart Alert)
  - [x] "Mark all read" action & unread indicator badge
  - [x] Pull-to-refresh & empty state handling

---

## 🎨 9. Design System & Accessibility Quality Gate — ✅ **COMPLETED**

- [x] **Design Tokens Compliance**
  - [x] Zero hardcoded color literals (all colors use `@esparex/design-tokens` semantic tokens)
  - [x] Zero unhoisted inline style objects (`StyleSheet.create` utilized)
- [x] **Mobile Input & Viewport Standards**
  - [x] All editable input font sizes `>= 16px` to prevent viewport auto-zoom on mobile
  - [x] All touchable targets `>= 48px` hitbox
- [x] **Accessibility (WCAG 2.2 AA)**
  - [x] Screen reader `accessibilityLabel` & `accessibilityRole` on all icon buttons
  - [x] Visible focus indicators and logical navigation order
- [x] **Build & Test Verification**
  - [x] `npm run type-check` exits with 0 errors
  - [x] `npm test` mobile test suites pass with 100% green (58/58 test suites, 210/210 tests)

---

# 🌐 Esparex Web Marketplace (`apps/web`) Master Checklist

> **Purpose**: Single dedicated task list for tracking implementation, UI refinement, and UX verification across the Web Marketplace application in `apps/web`.

---

## 🧭 1. Header & Global Navigation Shell (`components/layout/`) — ✅ **COMPLETED**
- [x] **Global Header** (`apps/web/src/components/user/Header.tsx`)
  - [x] Single-instance responsive component (CSS breakpoints `hidden md:flex`, `flex md:hidden`)
  - [x] Location selector modal trigger & active city pill
  - [x] Instant search bar with clear button & category selector
  - [x] "Post Ad" primary action CTA with auth interception
  - [x] User avatar / Auth menu dropdown (Account, My Ads, Messages, Wallet, Logout)
  - [x] Notifications bell trigger with unread counter
- [x] **Location Selector Modal** (`apps/web/src/components/location/LocationOverlayHost.tsx`)
  - [x] City / Area search input with debounce
  - [x] Browser Geolocation auto-detect trigger & IP fallback
  - [x] Popular metro cities quick-select chips
  - [x] All India selection & persistent localStorage synchronization
- [x] **Mobile Navigation Drawer & Bottom Bar** (`apps/web/src/components/mobile/MobileBottomNav.tsx`)
  - [x] Accessible focus-trapping drawer with `inert` attribute on backdrop
  - [x] Bottom sticky action bar on mobile viewports (`BottomActionsBar.tsx`)

---

## 🏠 2. Home Feed & Discovery Experience (`app/page.tsx`) — ✅ **COMPLETED**
- [x] **Hero & Banner Placement**
  - [x] Monetization display slot & hero announcement
  - [x] Dynamic location-aware greeting & stats
- [x] **Category & Brand Carousels**
  - [x] 1-click category navigators (Smartphones, Laptops, Tablets, Smartwatches, Spare Parts)
  - [x] Top brand filter chips (Apple, Samsung, Xiaomi, OnePlus, Dell, HP, etc.)
- [x] **Dynamic Feed & Recommendations**
  - [x] Fresh Listings grid with responsive column layout
  - [x] Verified Business spotlight cards
  - [x] Skeleton loaders & empty state fallbacks

---

## 🔍 3. Search & Browse Results View (`app/search/page.tsx`) — ✅ **COMPLETED**
- [x] **Search Engine & Filter Drawer**
  - [x] URL search params synchronization (`q`, `categoryId`, `minPrice`, `maxPrice`, `condition`, `verifiedOnly`, `sort`)
  - [x] Multi-faceted filter sidebar on Desktop / Bottom Sheet on Mobile
  - [x] Verified Business filter toggle
  - [x] Sort order dropdown (Newest, Price: Low to High, Price: High to Low)
- [x] **Listing Card Grid & List View**
  - [x] Unified `AdCardGrid` / `AdCardList` rendering
  - [x] Price badge with pre-formatted currency SSOT
  - [x] Favorite / bookmark optimistic toggle
  - [x] Responsive pagination / infinite scroll trigger
- [x] **Dedicated Entity Browse Views**
  - [x] Browse Repair Services (`apps/web/src/app/(public)/browse-services/page.tsx`)
  - [x] Browse Spare Parts (`apps/web/src/app/(public)/browse-spare-parts/page.tsx`)

---

## 📱 4. Listing Detail & Media Lightbox (`app/ads/[slug]/page.tsx`) — ✅ **COMPLETED**
- [x] **Media Viewer & Lightbox** (`apps/web/src/components/user/listing-detail/AdImageLightbox.tsx`)
  - [x] High-res image carousel with thumbnail navigation
  - [x] Fullscreen zoomable lightbox modal with keyboard Escape / Arrow key support
- [x] **Ad Content & Specifications**
  - [x] Device metadata table (Brand, Model, Condition, Warranty, Included Accessories)
  - [x] Verified seller badge, trust score, and member since date
  - [x] In-person transaction safety tips card
- [x] **Action Bar & Communication CTA**
  - [x] "Chat with Seller" direct message button
  - [x] Phone number reveal / call action with security mask
  - [x] Report ad modal dialog with categorization
- [x] **Dedicated Entity Detail Pages**
  - [x] Service Detail Page (`apps/web/src/app/(public)/services/[slug]/page.tsx`)
  - [x] Spare Part Detail Page (`apps/web/src/app/(public)/spare-parts/[slug]/page.tsx` & `spare-part-listings/[slug]/page.tsx`)

---

## 📝 5. Post Ad, Service & Spare Part Publishing (`apps/web`) — ✅ **COMPLETED**
- [x] **Post Ad 3-Step Wizard** (`apps/web/src/app/(private)/post-ad/page.tsx`)
  - [x] Step 1: Category & Device identification (Category, Brand, Model, Condition)
  - [x] Step 2: Details & Pricing (Title, Description, Price, Location with Zod empty-string unions)
  - [x] Step 3: Photos & Publishing (Drag-and-drop uploader, cover photo selector, HEIC/WebP auto-compression)
  - [x] All input font sizes `>= 16px` (`text-base` / `text-body-lg`) to prevent WebKit zoom distortion
  - [x] Clear step-by-step validation via `form.trigger(['field'])` without hidden field blocking
- [x] **Post Service Form** (`apps/web/src/app/(private)/post-service/page.tsx` & `apps/web/src/app/(private)/edit-service/[id]/page.tsx`)
  - [x] Business authentication gate (`can("postService", user)` requires `businessStatus === "live"`)
  - [x] Canonical `ListingForm` with `serviceFormConfig` (`LISTING_TYPE.SERVICE`)
  - [x] Multi-select service types (`serviceTypeIds[]`) with category cascade
  - [x] Validated title (10–100), minPrice, description (20–2000), auto-associated business location
- [x] **Post Spare Part Form** (`apps/web/src/app/(private)/post-spare-part-listing/page.tsx` & `apps/web/src/app/(private)/edit-spare-part/[id]/page.tsx`)
  - [x] Business authentication gate (`can("postParts", user)` requires `businessStatus === "live"`)
  - [x] Canonical `ListingForm` with `sparePartFormConfig` (`LISTING_TYPE.SPARE_PART`)
  - [x] Single-select spare part type (`sparePartTypeId`) with category cascade
  - [x] Validated title (5–120), price, description, auto-associated business location

---

## 💬 6. Chat & Real-Time Messaging (`app/chat/page.tsx`) — ✅ **COMPLETED**
- [x] **Conversation Hub**
  - [x] Thread list with search filter & unread counter badges
  - [x] Active conversation pane with real-time WebSocket connection
  - [x] Auto-reconnect with exponential backoff & offline banner
- [x] **Message Stream & Composer**
  - [x] Quick reply chips for fast negotiation
  - [x] Image attachment preview and upload
  - [x] Read receipts & timestamp indicators

---

## 👤 7. User Account & Management (`app/account/`) — ✅ **COMPLETED**
- [x] **Account Dashboard & Inventory**
  - [x] My Ads management (`app/account/ads/page.tsx`: Active, Pending, Sold, Expired) with edit / delete / mark sold actions
  - [x] My Services inventory (`app/account/services/page.tsx`: Active, Expired) with edit / renew / delete actions
  - [x] My Spare Parts inventory (`app/account/spare-parts/page.tsx`: Active, Expired) with edit / renew / delete actions
  - [x] Saved Ads / Bookmarks list
  - [x] Smart Alerts configuration (Keyword / category price alerts)
  - [x] User Profile & Notification preferences

---

## 🏢 8. Business & Service Center Directory (`app/business/`) — ✅ **COMPLETED**
- [x] **Business Directory & Profile Management**
  - [x] Verified repair shops & spare part wholesaler profiles
  - [x] Location-based service center locator
  - [x] Business registration & verification onboarding flow (`app/account/business/apply/page.tsx`)
  - [x] **Edit Business Profile Screen** (`apps/web/src/app/(private)/business/edit/page.tsx`)
    - [x] Pre-hydrates store details, contact numbers, address, and verification docs
    - [x] Reusable `BusinessProfileFlow` in edit mode with `PATCH /api/v1/businesses/:id`

---

## ♿ 9. Accessibility, Design Tokens & CWV Quality Gate — ✅ **COMPLETED**
- [x] **WCAG 2.2 AA Compliance**
  - [x] 100% keyboard navigable with visible focus rings (`focus-visible:ring-2`)
  - [x] Semantic HTML and descriptive `aria-label` / `role` attributes
- [x] **Design Tokens & Theme SSOT**
  - [x] Strict semantic token usage (`text-foreground`, `bg-muted`, `border-border`, etc.)
  - [x] 0 hardcoded `#hex` color literals
- [x] **Performance & Core Web Vitals**
  - [x] Next.js optimized `<Image>` components with proper sizes & priority flags
  - [x] LCP < 2.5s and CLS < 0.1 verified

---

# 🛡️ Esparex Admin Dashboard (`apps/admin`) Master Checklist

> **Purpose**: Single dedicated task list for tracking implementation, UI density, moderation workflows, and operational verification across the Admin operations portal in `apps/admin`.

---

## 📋 1. Listing Moderation & Content Safety (`app/ads/`) — ✅ **COMPLETED**
- [x] **Moderation Queue & Table**
  - [x] High-density moderation queue (Pending Review, Live, Rejected, Expired)
  - [x] Bulk & single-action approval / rejection with preset rejection reasons
  - [x] AI Auto-moderation review score & sensitive image flags
  - [x] Full listing preview modal with image inspector & seller history

---

## 👥 2. User & Business Verification (`app/users/` & `app/businesses/`) — ✅ **COMPLETED**
- [x] **User Management & KYC**
  - [x] User directory with search, ban/unban toggle, and session revocation
  - [x] Business KYC verification approval / rejection flow (`/business-requests`)
  - [x] Verified Business badge grant & tier assignment (Free, Pro, Enterprise)

---

## 💳 3. Monetization, Plans & Finance (`app/plans/` & `app/finance/`) — ✅ **COMPLETED**
- [x] **Plans & Revenue Ledger**
  - [x] User listing plans & Business subscription plans configuration
  - [x] Order history, payment gateway transaction status (Razorpay/Stripe), and refund actions
  - [x] GST invoice download & tax breakdown reports
  - [x] Ad placement slots & Google Ads / Banner inventory manager (`/google-ads`)

---

## 🚨 4. Disputes, Reports & Security Audit (`app/reports/` & `app/security/audit/`) — ✅ **COMPLETED**
- [x] **Dispute Resolution Hub**
  - [x] User report triage queue (Fraud, Prohibited Item, Spam, Duplicate)
  - [x] Seller penalty & ad takedown actions with automated user notifications
  - [x] Security audit logs (`/security/audit`) with IP, timestamp, and admin actor tracking

---

## 📊 5. Catalog, Locations & Admin Density UI Gate — ✅ **COMPLETED**
- [x] **Catalog & Geo-Location Management**
  - [x] Hierarchical catalog manager (Categories, Brands, Device Models, Spare Part Types)
  - [x] Location hierarchy manager (State, City, Tier-1/2/3 metro tagging, Geofencing)
- [x] **Admin UI Density & Keyboard Navigation**
  - [x] High-density table cells with compact padding and sticky headers
  - [x] Keyboard shortcuts (`Escape` for modals, arrow/tab navigation)
  - [x] Design token compliance with dark mode support

---

# ⚙️ Esparex Backend API & Core Engine (`backend/api` & `core`) Master Checklist

> **Purpose**: Single dedicated task list for tracking backend domain services, API routes, database resilience, rate limiting, and contract safety across `backend/api` and `@esparex/core`.

---

## 🔒 1. Auth, Sessions & Security Middleware (`backend/api`) — ✅ **COMPLETED**
- [x] **OTP Engine & Session Security**
  - [x] SMS OTP dispatch with rate limiting & exponential lockout protection
  - [x] JWT access token issuance, refresh token rotation, and single-session revocation
  - [x] Strict CORS origin validation & cookie parser with RFC 6265 compliant parsing

---

## 💰 2. Payment Webhooks, Plans & Idempotency (`core` & `backend/api`) — ✅ **COMPLETED**
- [x] **Payment Processing Engine**
  - [x] Razorpay & Stripe webhook signature verification with replay protection
  - [x] FEFO Entitlement consumption engine for paid listing credits
  - [x] Automated GST tax calculation & PDF invoice generator (`InvoicePdfService`)

---

## 🗄️ 3. Domain Services, Spatial Queries & Lifecycle (`core`) — ✅ **COMPLETED**
- [x] **Listing Engine & Spatial Location Search**
  - [x] Listing lifecycle state machine (Draft → Pending → Live → Sold → Expired → Deleted)
  - [x] MongoDB 2dsphere spatial indexing & GeoJSON point validation
  - [x] Image moderation pipeline with local OCR, perceptual hashing & duplicate detection
  - [x] Real-time WebSocket chat service with attachment MIME validation and read receipts

---

# 📱 Mobile (iOS & Android) Full-Stack Audit Checklist (Frontend + Backend)

> **Purpose**: Dedicated verification and audit checklist covering Frontend UI/UX (iOS & Android parity, touch targets, accessibility, offline/error handling) and Backend API integration (auth guards, DTO contract alignment, response schemas, status codes) for all mobile screens in `apps/mobile`.

---

## 🌐 1. Public Pages Audit (Guest Accessible)

### 1.1 Marketplace / Home Screen (`ROUTES.HOME_TAB`) — ✅ **AUDITED & VERIFIED**
- **Frontend ([MarketplaceScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/listings/presentation/screens/MarketplaceScreen.tsx))**:
  - [x] iOS & Android UI parity (feed rendering, header spacing, status bar inset)
  - [x] Location selector modal trigger & debounced city search
  - [x] Category pill horizontal scroll & selection state
  - [x] Filter bar chips & active filter badge count
  - [x] Infinite scroll pagination & zero layout shift loading skeleton (`ListingSkeleton`)
  - [x] Empty state & Error retry boundary verification
  - [x] Favorite / Save toggle redirects unauthenticated guest to `ROUTES.AUTH_STACK`
- **Backend API Integration**:
  - [x] `GET /api/v1/listings` (pagination, category filters, location filtering)
  - [x] `GET /api/v1/categories` (active categories tree & icon mapping)
  - [x] `GET /api/v1/locations` (city/locality search & geospatial bounding)
  - [x] Contract compliance: Response adheres to `ListingDTO` contract in `@esparex/contracts`

### 1.2 Search & Discovery Screen (`ROUTES.SEARCH_TAB`) — ✅ **AUDITED & VERIFIED**
- **Frontend ([SearchScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/listings/presentation/screens/SearchScreen.tsx))**:
  - [x] iOS & Android keyboard auto-dismiss & clear search query (`X`) button
  - [x] Recent searches localStorage cache & "Clear All" action
  - [x] Trending searches chips tap-to-search behavior
  - [x] Filter bottom sheet modal (`FilterModal.tsx`): price range, condition, verified-only toggle
  - [x] Search results grid pagination & empty state
- **Backend API Integration**:
  - [x] `GET /api/v1/listings/search` (query param parsing: `q`, `categoryId`, `minPrice`, `maxPrice`, `condition`, `sort`)
  - [x] Rate limiting & empty search response handling

### 1.3 Listing Details Screen (`ROUTES.LISTING_DETAILS`) — ✅ **AUDITED & VERIFIED**
- **Frontend ([ListingDetailsScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/listings/presentation/screens/ListingDetailsScreen.tsx))**:
  - [x] Image carousel pagination dots & smooth swipe on iOS & Android
  - [x] Native share sheet trigger (`Share.share`)
  - [x] Dynamic sticky action bar: "Edit" for owner vs "Chat with Seller" for buyer
  - [x] Unauthenticated click on "Chat with Seller" or "Save" prompts `ROUTES.AUTH_STACK`
  - [x] Safety reminder dialog & report ad modal trigger
  - [x] Compact 3-tab segmented layout with auto-scroll: Tab 1 "Repair Shops" (default), Tab 2 "Description", Tab 3 "Spare Parts" (with badge count)
  - [x] Canonical device condition badge enforcement: only 'Power On' (variant="success") and 'Power Off' (variant="warning")
- **Backend API Integration**:
  - [x] `GET /api/v1/listings/:id` (returns full detail with seller profile & formatted price)
  - [x] `POST /api/v1/listings/:id/save` (auth guard 401 for guests, 200 for authenticated)
  - [x] `POST /api/v1/chat/conversations` (initiates conversation thread for buyer)

### 1.4 Login Screen (`ROUTES.LOGIN`) — ✅ **AUDITED & VERIFIED**
- **Frontend ([LoginScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/auth/screens/LoginScreen.tsx))**:
  - [x] Mobile input format (+91 prefix, 10-digit strict validation & paste normalization)
  - [x] Input font size >= 16px to prevent viewport zoom jumps
  - [x] "Send OTP" CTA button active/disabled states & loading spinner
  - [x] Interactive link navigation to Terms & Privacy Policy
  - [x] `KeyboardAvoidingView` offsets on iOS and Android
- **Backend API Integration**:
  - [x] `POST /api/v1/auth/send-otp` (rate limiting, validation, response format)

### 1.5 OTP Verification Screen (`ROUTES.OTP`) — ✅ **AUDITED & VERIFIED**
- **Frontend ([OTPScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/auth/screens/OTPScreen.tsx))**:
  - [x] 6-digit segmented OTP input cells auto-focus progression
  - [x] SMS OTP auto-fill & clipboard paste support (iOS & Android)
  - [x] Resend OTP countdown timer & cooldown lock
  - [x] "Edit mobile number" back action with `cancelOtp`
  - [x] New user name input field when `isNewUser === true`
- **Backend API Integration**:
  - [x] `POST /api/v1/auth/verify-otp` (JWT token issuance, refresh token, user object)
  - [x] `POST /api/v1/auth/cancel-otp` (OTP session cancellation)
  - [x] Error status handling (400 Invalid OTP, 423 Lockout, 429 Too Many Attempts)

### 1.6 Terms & Privacy Policy Screen (`ROUTES.TERMS_AND_PRIVACY`) — ✅ **AUDITED & VERIFIED**
- **Frontend ([TermsAndPrivacyScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/user/presentation/screens/TermsAndPrivacyScreen.tsx))**:
  - [x] Accessible navigation back button (44px touch target, safe dismissal fallback to `MAIN_STACK`, Android `BackHandler`) & clean typography hierarchy
  - [x] Segmented section filter tabs (`All`, `Terms of Service`, `Privacy Policy`, `Safety & Grievance`) with badge indicators
  - [x] Statutory compliance review: Intermediary status (IT Act 2000 Sec 79), 18+ eligibility (Indian Contract Act 1872), in-person safety advisory, Rule 3(1)(b) prohibited goods, DPDP Act 2023 data rights & deletion
  - [x] Statutory Grievance Redressal card (Rule 3(2) IT Rules 2021) with interactive actions (`mailto:`, `tel:`, web terms & privacy URLs)
  - [x] Single Source of Truth (SSOT) legal constants centralized in `@esparex/shared`
- **Backend API Integration**:
  - [x] Static offline-first document rendering with zero-network failure risk for statutory disclosures
  - [x] Backend editorial endpoints (`GET /api/v1/editorial/:slug`, `PATCH /api/v1/editorial/:slug`, `GET /api/v1/editorial`) verified with 100% test coverage

---

## 🔒 2. Hybrid / Gated Pages Audit (In-Screen Barrier for Guests)

### 2.1 Post Ad Screen (`ROUTES.POST_AD_TAB`)
- **Frontend ([PostAdScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/postAd/presentation/PostAdScreen.tsx))**:
  - [x] Guest gate: Unauthenticated users see "Sign in to post an ad" CTA
  - [x] 3-step wizard workflow (Category → Details & Pricing → Media & Publishing)
  - [x] Step-isolated form validation (cannot advance without required fields)
  - [x] Android hardware back button handler (`BackHandler`) steps back without tab exit
  - [x] Camera capture, image picker, thumbnail grid, and cover image selector
  - [x] Multi-platform `KeyboardAvoidingView` behavior (iOS `padding` vs Android `height`)
- **Backend API Integration**:
  - [x] `POST /api/v1/media/upload-url` (presigned S3/storage URL generation)
  - [x] `POST /api/v1/listings` (listing creation with Zod empty-string unions)
  - [x] FEFO ad credits check & deduction validation

### 2.2 Chat / Messages Screen (`ROUTES.CONVERSATION_LIST`)
- **Frontend ([ConversationListScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/chat/presentation/screens/ConversationListScreen.tsx))**:
  - [x] Guest gate: Unauthenticated users see "Sign in to view messages" CTA
  - [x] Real-time conversation list with participant avatar, listing snippet, last message, and timestamp
  - [x] Unread conversation badge counter
  - [x] Filter conversations by participant name or ad title
  - [x] Pull-to-refresh & empty inbox state
- **Backend API Integration**:
  - [x] `GET /api/v1/chat/conversations` (returns user's conversation threads)
  - [x] Auth guard: 401 Unauthorized for unauthenticated requests

### 2.3 Profile Overview Screen (`ROUTES.PROFILE_OVERVIEW`)
- **Frontend ([ProfileScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/user/presentation/screens/ProfileScreen.tsx))**:
  - [x] Guest gate: Welcome card with Guest Avatar & "Sign In / Register" CTA
  - [x] Authenticated view: User profile card, verification badge, and categorized menu sections
  - [x] Dynamic menu routing (My Listings, Saved Ads, Smart Alerts, Business, Plans, Settings)
  - [x] Pull-to-refresh user profile data
- **Backend API Integration**:
  - [x] `GET /api/v1/users/me` (profile details, verification status, user type)
  - [x] `GET /api/v1/business/profile` (business store status check)

---

## 🔐 3. Strictly Private Pages Audit (Auth Session Required)

### 3.1 Chat Thread Screen (`ROUTES.CHAT_THREAD`)
- **Frontend ([ChatThreadScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/chat/presentation/screens/ChatThreadScreen.tsx))**:
  - [x] Buyer vs. Seller message bubble styling & layout
  - [x] Message receipts (`MobileChatMessageReceipt`: Sent, Delivered, Read, Failed)
  - [x] Quick reply chips ("Is this still available?", etc.)
  - [x] Keyboard input bar pinning without viewport jumping on iOS & Android
  - [x] Optimistic sending & message retry on network failure
- **Backend API Integration**:
  - [x] `GET /api/v1/chat/conversations/:id/messages` (paginated message history)
  - [x] `POST /api/v1/chat/conversations/:id/messages` (message dispatch)
  - [x] WebSocket connection & real-time message broadcasting

### 3.2 Notifications Screen (`ROUTES.NOTIFICATIONS`)
- **Frontend ([NotificationScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/notifications/presentation/screens/NotificationScreen.tsx))**:
  - [x] Categorized notification icons (Chat, Ad Status, Price Drop, Smart Alert)
  - [x] Deep-link navigation on tap (`esparex://chat/thread/:id`, `esparex://listing/:id`)
  - [x] "Mark all read" action & unread indicator badge
  - [x] Pull-to-refresh & empty notification state
- **Backend API Integration**:
  - [x] `GET /api/v1/notifications` (returns user notifications list)
  - [x] `PATCH /api/v1/notifications/:id/read` & `PATCH /api/v1/notifications/all/read`
  - [x] `POST /api/v1/notifications/register` (Expo push token registration for iOS/Android)

### 3.3 Account Settings Screen (`ROUTES.PROFILE_SETTINGS`)
- **Frontend ([SettingsScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/user/presentation/screens/SettingsScreen.tsx))**:
  - [x] Account details card with "Edit" modal (`EditProfileModal.tsx`)
  - [x] Push notification toggle switch with optimistic UI update
  - [x] Sign Out action with confirmation dialog & token cleanup
- **Backend API Integration**:
  - [x] `PATCH /api/v1/users/me` (name, email, notification preferences)
  - [x] `POST /api/v1/auth/logout` (session revocation & push token de-registration)

### 3.4 My Listings Screen (`ROUTES.MY_LISTINGS`)
- **Frontend ([MyListingsScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/listings/presentation/screens/MyListingsScreen.tsx))**:
  - [x] Status tabs filter (`All`, `Live`, `Pending`, `Sold`, `Expired`, `Draft`)
  - [x] Infinite scroll pagination & pull-to-refresh
  - [x] Tap to navigate to listing details or edit listing
- **Backend API Integration**:
  - [x] `GET /api/v1/listings/my-listings` (status filter parameter support)

### 3.5 Edit Listing Screen (`ROUTES.EDIT_LISTING`)
- **Frontend ([EditListingScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/listings/presentation/screens/EditListingScreen.tsx))**:
  - [x] Pre-filled form with current title, price, description
  - [x] Client-side validation: title required, non-negative price
  - [x] Optimistic mutation handling & back navigation upon success
- **Backend API Integration**:
  - [x] `PATCH /api/v1/listings/:id` (ad update validation & ownership guard)

### 3.6 Saved Ads Screen (`ROUTES.SAVED_ADS`)
- **Frontend ([SavedAdsScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/listings/presentation/screens/SavedAdsScreen.tsx))**:
  - [x] Grid/list of favorited ads with optimistic unsave/remove action
  - [x] Empty state with "Explore Listings" navigation button
- **Backend API Integration**:
  - [x] `GET /api/v1/listings/saved` (returns bookmarked ads for the authenticated user)
  - [x] `DELETE /api/v1/listings/:id/save` (removes bookmark)

### 3.7 Smart Alerts Screen (`ROUTES.SMART_ALERTS`)
- **Frontend ([SmartAlertsScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/smartAlert/presentation/screens/SmartAlertsScreen.tsx))**:
  - [x] Active search alerts list with criteria overview (keyword, category, location, max price)
  - [x] "Create Smart Alert" modal dialog (`CreateSmartAlertModal.tsx`)
  - [x] Delete alert action with confirmation alert
- **Backend API Integration**:
  - [x] `GET /api/v1/smart-alerts` (fetch user alerts)
  - [x] `POST /api/v1/smart-alerts` (create new alert)
  - [x] `DELETE /api/v1/smart-alerts/:id` (delete alert)

### 3.8 Business Registration Screen (`ROUTES.BUSINESS_REGISTRATION`)
- **Frontend ([BusinessRegistrationWizardScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/business/presentation/screens/BusinessRegistrationWizardScreen.tsx))**:
  - [x] 4-step wizard (Business Info, Location Details, Document Uploads, Review & Submit)
  - [x] GSTIN format validation & document upload handling
  - [x] Cancellation & exit confirmation dialog
- **Backend API Integration**:
  - [x] `POST /api/v1/business/register` (creates KYC business verification request)

### 3.9 Business Status Screen (`ROUTES.BUSINESS_STATUS`)
- **Frontend ([BusinessStatusScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/business/presentation/screens/BusinessStatusScreen.tsx))**:
  - [x] Status banner states (`Pending Verification`, `Verified Business`, `Application Rejected`)
  - [x] Rejection explanation & "Update Application" navigation
- **Backend API Integration**:
  - [x] `GET /api/v1/business/profile` (returns business verification status)

### 3.10 Edit Business Profile Screen / Flow (`ROUTES.BUSINESS_REGISTRATION` / Edit Mode)
- **Frontend ([BusinessRegistrationWizardScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/business/presentation/screens/BusinessRegistrationWizardScreen.tsx))**:
  - [x] Edit flow for active/verified businesses to update store information, shop address, and contact details
  - [x] Form pre-hydration with current business profile data
  - [x] Dynamic CTA in `BusinessStatusScreen` for verified businesses
- **Backend API Integration**:
  - [x] `PATCH /api/v1/businesses/:id` (validated by `updateBusinessSchema`)
  - [x] `ApiBusinessRepository.updateBusiness()` client implementation

### 3.11 Plan Selection & Wallet Screen (`ROUTES.PLAN_SELECTION`)
- **Frontend ([PlanSelectionScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/payment/presentation/screens/PlanSelectionScreen.tsx))**:
  - [x] Tier cards: Ad posting credit packages & Spotlight promotion slots
  - [x] Current credit balance overview
  - [x] Razorpay payment checkout integration with dismiss & error handlers
- **Backend API Integration**:
  - [x] `GET /api/v1/plans` (active monetization plans & prices)
  - [x] `POST /api/v1/payments/create-order` (Razorpay order ID generation)
  - [x] `POST /api/v1/payments/verify` (webhook / signature verification)

### 3.12 Transaction History Screen (`ROUTES.TRANSACTION_HISTORY`)
- **Frontend ([TransactionHistoryScreen.tsx](file:///Users/admin/Desktop/Esparex/apps/mobile/src/features/payment/presentation/screens/TransactionHistoryScreen.tsx))**:
  - [x] Transaction cards: order amount, credits granted, date, and status (`SUCCESS`, `PENDING`, `FAILED`)
  - [x] Pull-to-refresh & empty history view
- **Backend API Integration**:
  - [x] `GET /api/v1/payments/transactions` (user transaction ledger)

---

## 📱 4. Cross-Platform Parity & Technical Verification Gate

- [x] **Platform Native Parity**:
  - [x] iOS vs Android visual inspection (spacing, typography, borders, shadows)
  - [x] Hardware back button navigation on Android tested across all modal & wizard screens
  - [x] Push notification receipt & deep linking tested on both APNs (iOS) and FCM (Android)
- [x] **Accessibility (WCAG 2.2 AA)**:
  - [x] Minimum 44-48px touch targets on all interactive controls (hitSlop on compact buttons)
  - [x] Input font-sizes >= 16px to prevent WebKit auto-zoom jumps on mobile
  - [x] Screen reader (`accessibilityRole`, `accessibilityLabel`) on all interactive inputs and icon buttons
- [x] **Contract & API Robustness**:
  - [x] 100% adherence to `@esparex/contracts` DTO models across all frontend repositories
  - [x] Network timeout & offline error handling displays `ErrorState` with retry CTA
  - [x] Zero unhandled promise rejections on API failures
