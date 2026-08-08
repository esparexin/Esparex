# Enterprise Platform State Coverage Matrix

**Scope**: All user-facing features across Web App (`apps/web`), Admin App (`apps/admin`), and Mobile App (`apps/mobile`).

**Rule**: Every feature, form, search, modal, list, and detail screen MUST declare and implement all applicable application states using canonical single-instance SSOT components. Local ad-hoc state fallbacks are strictly prohibited.

---

## 1. Enterprise System State Matrix

| System State | Description | Mandatory SSOT Primitive | Web Implementation | Mobile Implementation |
|:---|:---|:---:|:---|:---|
| **Loading** | Full-page / view data fetching | `<PageLoader>` / `<Spinner>` | `packages/ui` / `Spinner.tsx` | `packages/mobile-ui` / `AppText` |
| **Skeleton** | Incremental UI placeholders | `<Skeleton>` | `packages/ui` / `Skeleton.tsx` | Custom SVG / View Skeleton |
| **Empty** | Zero items found / empty set | `<EmptyCard>` / `<EmptyState>` | `packages/ui` / `DataTableBody` | Feature `emptyCard` / `Card` |
| **Error** | API / Network / App failure | `<AppErrorBoundary>` / `Popup` | `packages/ui` / `AppPopup` | `AppErrorBoundary` / `AppPopup` |
| **Success** | Confirmation of operation | `<Toast>` / `Popup` / `Badge` | `packages/ui` / `StatusChip` | `StatusChip` / `Popup` |
| **Offline** | Network disconnected | `<OfflineBanner>` | Network Banner SSOT | Network Banner SSOT |
| **Unauthorized** | 401 / Session expired | `<AuthGuard>` redirect | Auth Context / Guard | Auth Context / Guard |
| **Retry** | Failed request retry affordance | `<RetryButton>` | Action Button | Action Button |
| **Partial Data** | Stale / Cached data loading | `<SubtleLoadingBar>` | Progress Indicator | Progress Indicator |

---

## 2. Feature State Coverage Assessment

| Feature Module | Loading | Skeleton | Empty | Error | Success | Offline | Unauthorized | Retry | Partial |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Listings & Search** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Post Ad Wizard** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Chat & Messages** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Payment & Plans** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Smart Alerts** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Business Registration** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 3. Governance Constraints & Anti-Fallacy Rules

1. **Zero Ad-Hoc Empty States**: No inline `<div>No data found</div>` or `<Text>No items</Text>`. All empty states must consume canonical SSOT primitives.
2. **Unified Error Handling**: API error responses must flow through `popupBus` / `AppPopup` or form field validation bounds.
3. **Optimistic Updates**: Dynamic updates (e.g. Save Ad, Like, Delete) must handle rollbacks gracefully upon error.
