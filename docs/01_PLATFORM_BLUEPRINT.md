# 01_PLATFORM_BLUEPRINT — Product & Marketplace Logic

## 🎯 Platform Vision
Esparex is a high-trust, high-performance marketplace for spare parts and automotive services in India. Trust is built on **identity verification** and **strict lifecycle governance**.

---

## 👤 User Identity Logic
- **Mobile First**: Mobile number is the non-mutable, permanent identifier for all users.
- **Verification**: OTP (One-Time Password) is the primary authentication mechanism, tied to physical device access.
- **One Account Policy**: One mobile number = One account. Forever. This prevents fraud and ensures accountability for reviews and transactions.

---

## 🛒 Marketplace Mechanics

### Ad Quotas & Monetization
- **Free Quota**: Individual users receive 5 free ads per calendar month.
- **Reset Policy**: Free quotas reset on the 1st of every month (UTC+5:30); unused ads do not roll over.
- **Paid Ad Packs**: Users can purchase ad packs in bulk (e.g., 10, 25, 50). Purchased ads **never expire**.
- **Subscription Plans**: Business users can subscribe for higher limits and premium features.

### Validity vs. Visibility
- **Ad Validity**: The lifespan of an ad (default 30 days) during which it is eligible to be live.
- **Visibility Boosts (Spotlight)**: Premium features that increase an ad's prominence (e.g., top-of-search placement) for a limited duration (e.g., 7 days).
- **Urgent Boosts**: Short-term spikes (24-48 hours) for high-urgency sales.

---

## 🛡️ Trust & Safety Principles
- **Admin Moderation**: Every new or edited ad must pass human or AI moderation before going live.
- **Identity Integrity**: Number changes are prohibited to prevent "reputation laundering" by malicious actors.
- **Review System**: Buyers and sellers rate each other post-transaction to build a permanent trust score.
