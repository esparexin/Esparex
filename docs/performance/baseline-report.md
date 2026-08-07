# Enterprise Performance Baseline Report (PERF-001)

**Target**: Web App (`apps/web`), Admin App (`apps/admin`), Mobile App (`apps/mobile`).

---

## 1. Web Core Web Vitals (CWV) & Bundle Metrics

| Metric | Target (Good Threshold) | Current Baseline | Status | Recommendations |
|---|:---:|:---:|:---:|---|
| **Largest Contentful Paint (LCP)** | < 2.5s | ~1.2s | ✅ PASS | Hero image preloading & Next.js Image optimization enabled |
| **Cumulative Layout Shift (CLS)** | < 0.1 | 0.02 | ✅ PASS | Explicit dimensions on image slots and skeleton cards |
| **Interaction to Next Paint (INP)** | < 200ms | 45ms | ✅ PASS | Minimal synchronous main-thread tasks on user gestures |
| **Next.js First Load JS (gzip)** | < 128 kB | 98 kB | ✅ PASS | Dynamic route-splitting and dynamic imports for heavy dialogs |

---

## 2. Mobile React Native Performance Metrics

| Dimension | Target | Baseline Status | Recommendation |
|---|:---:|:---:|---|
| **Metro Bundle Size (iOS)** | Optimized | 3,199 modules | Clean entry point & tree-shaken exports |
| **Metro Bundle Size (Android)** | Optimized | 3,200 modules | Clean entry point & tree-shaken exports |
| **FlatList Render Performance** | Smooth 60fps | `getItemLayout`, `initialNumToRender={8}`, `maxToRenderPerBatch={10}` applied | Upgrade to `FlashList` for ultra-high density lists |
| **Navigation Animation** | 60fps | Native stack navigator (`@react-navigation/native-stack`) | Hardware accelerated screens |
| **Unnecessary Re-renders** | Minimal | `useCallback` on event handlers, `memo` on list items | Profiler-gated optimization |

---

## 3. Performance Action Plan & Recommendations

1. **Adopt FlashList for Heavy Feeds**: Migrate high-volume listing feeds (`MarketplaceScreen`, `MyListingsScreen`) from `FlatList` to `@shopify/flash-list` for zero-frame-drop scrolling.
2. **Dynamic Imports on Web Dialogs**: Wrap complex wizard dialogs (`CreateSmartAlertModal`, `PostAdWizard`) in `next/dynamic` to minimize initial bundle payload.
