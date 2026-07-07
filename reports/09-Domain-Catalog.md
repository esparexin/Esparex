# 09. Domain Catalog

## Business Domains

### 1. Authentication & Identity
* **Purpose:** Manages user registration, login, JWT issuance, OTP, and Admin sessions.
* **Database Models:** `User.ts`, `Admin.ts`, `Otp.ts`, `AdminSession.ts`, `ApiKey.ts`
* **APIs:** `authRoutes.ts`, `userRoutes.ts`
* **Dependencies:** Shared schemas, Mailer, SMS gateway.

### 2. Listings (Ads)
* **Purpose:** Core marketplace entities, buying/selling items.
* **Database Models:** `Ad.ts`, `AdImage.ts`, `SavedAd.ts`, `AdAnalytics.ts`, `AdMetrics.ts`
* **APIs:** `listingRoutes.ts`
* **Dependencies:** Master Data (Brands/Categories), Location, Image Storage (S3).

### 3. Master Data (Catalog)
* **Purpose:** Taxonomic data used to classify listings (Brands, Models, etc.).
* **Database Models:** `Brand.ts`, `Category.ts`, `Model.ts`, `Variant.ts`, `SparePart.ts`, `Location.ts`
* **APIs:** `catalogRoutes.ts`, `adminCatalogRoutes.ts`
* **Owner:** Admins (CRUD operations restricted to Admin).

### 4. Communications (Chat)
* **Purpose:** Buyer-seller messaging.
* **Database Models:** `Conversation.ts`, `ChatMessage.ts`, `ChatReport.ts`
* **APIs:** `chatRoutes.ts`, Socket.IO events.

### 5. Monetization & Payments
* **Purpose:** Handling subscriptions, boosts, wallets.
* **Database Models:** `Plan.ts`, `Transaction.ts`, `Invoice.ts`, `Boost.ts`, `UserWallet.ts`, `UserPlan.ts`
* **APIs:** `paymentRoutes.ts`
* **External Services:** Razorpay.

### 6. Engagement & Alerts
* **Purpose:** Automated user notifications and saved searches.
* **Database Models:** `SmartAlert.ts`, `Notification.ts`, `SavedSearch.ts`
* **APIs:** `smartAlertRoutes.ts`, `notificationRoutes.ts`
