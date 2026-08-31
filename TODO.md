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

---

## 📝 5. Post Ad 3-Step Wizard (`app/post-ad/page.tsx`) — ✅ **COMPLETED**
- [x] **Step Isolation & Schema Governance**
  - [x] Step 1: Category & Device identification (Category, Brand, Model, Condition)
  - [x] Step 2: Details & Pricing (Title, Description, Price, Location with Zod empty-string unions)
  - [x] Step 3: Photos & Publishing (Drag-and-drop uploader, cover photo selector, HEIC/WebP auto-compression)
- [x] **Mobile Input Standards**
  - [x] All input font sizes `>= 16px` (`text-base` / `text-body-lg`) to prevent WebKit zoom distortion
  - [x] Clear step-by-step validation via `form.trigger(['field'])` without hidden field blocking

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
- [x] **Account Dashboard**
  - [x] My Ads management (Active, Pending, Sold, Expired) with edit / delete / mark sold actions
  - [x] Saved Ads / Bookmarks list
  - [x] Smart Alerts configuration (Keyword / category price alerts)
  - [x] User Profile & Notification preferences

---

## 🏢 8. Business & Service Center Directory (`app/business/`) — ✅ **COMPLETED**
- [x] **Business Directory**
  - [x] Verified repair shops & spare part wholesaler profiles
  - [x] Location-based service center locator
  - [x] Business registration & verification onboarding flow

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
