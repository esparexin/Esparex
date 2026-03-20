# Frontend Type Audit Report

Date: 2026-02-22

## Current Snapshot
- Total lint warnings: 60
- no-explicit-any warnings: 41

## Warning Breakdown by Rule
| Rule | Count |
|---|---:|
| @typescript-eslint/no-explicit-any | 41 |
| next/no-img-element | 8 |
| no-restricted-syntax | 5 |
| react-hooks/set-state-in-effect | 3 |
| @next/next/no-html-link-for-pages | 2 |
| react-hooks/exhaustive-deps | 1 |

## no-explicit-any by File
| File | Count |
|---|---:|
| frontend/src/components/admin/views/ChatModeration.tsx | 3 |
| frontend/src/components/admin/views/InvoicesManager.tsx | 3 |
| frontend/src/components/admin/views/ModerationQueue.tsx | 3 |
| frontend/src/components/admin/views/settings/AdminUsersSettings.tsx | 3 |
| frontend/src/components/ui/chart.tsx | 3 |
| frontend/src/components/admin/monetization/WalletAdjustmentDialog.tsx | 2 |
| frontend/src/components/admin/tools/BulkImportTool.tsx | 2 |
| frontend/src/components/admin/views/AdManagement.tsx | 2 |
| frontend/src/components/admin/views/master-data/managers/SparePartManager.tsx | 2 |
| frontend/src/components/home/HomeAdsManager.tsx | 2 |
| frontend/src/components/ui/dialog.tsx | 2 |
| frontend/src/components/admin/shared/cards/StatsCard.tsx | 1 |
| frontend/src/components/admin/shared/messages/AdminMessage.tsx | 1 |
| frontend/src/components/admin/views/Analytics.tsx | 1 |
| frontend/src/components/admin/views/AuditLogs.tsx | 1 |
| frontend/src/components/admin/views/DashboardOverview.tsx | 1 |
| frontend/src/components/admin/views/SmartAlertsManager.tsx | 1 |
| frontend/src/components/admin/views/category-manager/components/AttributeTab.tsx | 1 |
| frontend/src/components/admin/views/location/DistrictsDatabase.tsx | 1 |
| frontend/src/components/admin/views/location/PopularLocations.tsx | 1 |
| frontend/src/components/admin/views/master-data/managers/ModelManager.tsx | 1 |
| frontend/src/components/location/InlineLocationSelector.tsx | 1 |
| frontend/src/components/user/AdCard.tsx | 1 |
| frontend/src/components/user/SafetyTips.tsx | 1 |
| frontend/src/components/user/StaticPages.tsx | 1 |

## Full Warning Inventory
| File | Rule | Line | Message |
|---|---|---:|---|
| frontend/src/app/global-error.tsx | @next/next/no-html-link-for-pages | 47 | Do not use an `<a>` element to navigate to `/`. Use `<Link />` from `next/link` instead. See: https://nextjs.org/docs/messages/no-html-link-for-pages |
| frontend/src/components/admin/AdminLayout.tsx | @next/next/no-html-link-for-pages | 142 | Do not use an `<a>` element to navigate to `/`. Use `<Link />` from `next/link` instead. See: https://nextjs.org/docs/messages/no-html-link-for-pages |
| frontend/src/components/admin/AdminPage.tsx | react-hooks/set-state-in-effect | 80 | Error: Calling setState synchronously within an effect can trigger cascading renders  Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes.  Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).  /Users/admin/Desktop/EsparexAdmin/frontend/src/components/admin/AdminPage.tsx:80:13   78 \|     useEffect(() => {   79 \|         if (initialView && initialView !== activeView) { > 80 \|             setActiveView(initialView);      \|             ^^^^^^^^^^^^^ Avoid calling setState() directly within an effect   81 \|         }   82 \|     }, [initialView]);   83 \| |
| frontend/src/components/admin/AdminPage.tsx | react-hooks/exhaustive-deps | 82 | React Hook useEffect has a missing dependency: 'activeView'. Either include it or remove the dependency array. |
| frontend/src/components/admin/AdminPage.tsx | no-restricted-syntax | 100 | ❌ Direct 'router.push/replace' in render body is dangerous. Wrap in 'useEffect' or event handler. |
| frontend/src/components/admin/monetization/WalletAdjustmentDialog.tsx | @typescript-eslint/no-explicit-any | 22 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/monetization/WalletAdjustmentDialog.tsx | @typescript-eslint/no-explicit-any | 52 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/shared/SecureImageUpload.tsx | next/no-img-element | 130 | Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element |
| frontend/src/components/admin/shared/cards/StatsCard.tsx | @typescript-eslint/no-explicit-any | 8 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/shared/messages/AdminMessage.tsx | @typescript-eslint/no-explicit-any | 164 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/tools/BulkImportTool.tsx | @typescript-eslint/no-explicit-any | 31 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/tools/BulkImportTool.tsx | @typescript-eslint/no-explicit-any | 74 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/AdManagement.tsx | @typescript-eslint/no-explicit-any | 511 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/AdManagement.tsx | @typescript-eslint/no-explicit-any | 663 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/Analytics.tsx | @typescript-eslint/no-explicit-any | 46 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/AuditLogs.tsx | @typescript-eslint/no-explicit-any | 52 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/ChatModeration.tsx | @typescript-eslint/no-explicit-any | 154 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/ChatModeration.tsx | @typescript-eslint/no-explicit-any | 157 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/ChatModeration.tsx | @typescript-eslint/no-explicit-any | 189 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/DashboardOverview.tsx | @typescript-eslint/no-explicit-any | 196 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/InvoicesManager.tsx | @typescript-eslint/no-explicit-any | 137 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/InvoicesManager.tsx | @typescript-eslint/no-explicit-any | 139 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/InvoicesManager.tsx | @typescript-eslint/no-explicit-any | 186 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/ModerationQueue.tsx | @typescript-eslint/no-explicit-any | 93 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/ModerationQueue.tsx | @typescript-eslint/no-explicit-any | 97 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/ModerationQueue.tsx | @typescript-eslint/no-explicit-any | 153 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/SmartAlertsManager.tsx | @typescript-eslint/no-explicit-any | 16 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/category-manager/components/AttributeTab.tsx | @typescript-eslint/no-explicit-any | 328 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/location/DistrictsDatabase.tsx | @typescript-eslint/no-explicit-any | 76 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/location/PopularLocations.tsx | @typescript-eslint/no-explicit-any | 36 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/master-data/managers/ModelManager.tsx | @typescript-eslint/no-explicit-any | 142 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/master-data/managers/ScreenSizeManager.tsx | react-hooks/set-state-in-effect | 40 | Error: Calling setState synchronously within an effect can trigger cascading renders  Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes.  Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).  /Users/admin/Desktop/EsparexAdmin/frontend/src/components/admin/views/master-data/managers/ScreenSizeManager.tsx:40:13   38 \|     useEffect(() => {   39 \|         if (validCategories.length === 1 && filterCategoryId === 'all') { > 40 \|             setFilterCategoryId(validCategories[0]!.id);      \|             ^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect   41 \|         }   42 \|     }, [filterCategoryId, validCategories]);   43 \| |
| frontend/src/components/admin/views/master-data/managers/SparePartManager.tsx | @typescript-eslint/no-explicit-any | 140 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/master-data/managers/SparePartManager.tsx | @typescript-eslint/no-explicit-any | 143 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/settings/AdminUsersSettings.tsx | @typescript-eslint/no-explicit-any | 208 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/settings/AdminUsersSettings.tsx | @typescript-eslint/no-explicit-any | 352 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/settings/AdminUsersSettings.tsx | @typescript-eslint/no-explicit-any | 412 | Unexpected any. Specify a different type. |
| frontend/src/components/admin/views/settings/BrandingSettings.tsx | next/no-img-element | 306 | Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element |
| frontend/src/components/admin/views/settings/BrandingSettings.tsx | next/no-img-element | 379 | Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element |
| frontend/src/components/common/PlaceholderImage.tsx | next/no-img-element | 48 | Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element |
| frontend/src/components/home/HomeAdsManager.tsx | @typescript-eslint/no-explicit-any | 81 | Unexpected any. Specify a different type. |
| frontend/src/components/home/HomeAdsManager.tsx | @typescript-eslint/no-explicit-any | 85 | Unexpected any. Specify a different type. |
| frontend/src/components/location/InlineLocationSelector.tsx | @typescript-eslint/no-explicit-any | 255 | Unexpected any. Specify a different type. |
| frontend/src/components/pwa/PWAInstallPrompt.tsx | react-hooks/set-state-in-effect | 72 | Error: Calling setState synchronously within an effect can trigger cascading renders  Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes.  Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).  /Users/admin/Desktop/EsparexAdmin/frontend/src/components/pwa/PWAInstallPrompt.tsx:72:13   70 \|         // Re-check when pathname changes   71 \|         if (deferredPrompt) { > 72 \|             checkDisplayCriteria();      \|             ^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect   73 \|         }   74 \|     }, [pathname, deferredPrompt, checkDisplayCriteria]);   75 \| |
| frontend/src/components/ui/chart.tsx | @typescript-eslint/no-explicit-any | 159 | Unexpected any. Specify a different type. |
| frontend/src/components/ui/chart.tsx | @typescript-eslint/no-explicit-any | 208 | Unexpected any. Specify a different type. |
| frontend/src/components/ui/chart.tsx | @typescript-eslint/no-explicit-any | 208 | Unexpected any. Specify a different type. |
| frontend/src/components/ui/dialog.tsx | @typescript-eslint/no-explicit-any | 120 | Unexpected any. Specify a different type. |
| frontend/src/components/ui/dialog.tsx | @typescript-eslint/no-explicit-any | 124 | Unexpected any. Specify a different type. |
| frontend/src/components/user/AdCard.tsx | @typescript-eslint/no-explicit-any | 278 | Unexpected any. Specify a different type. |
| frontend/src/components/user/ProfileSettingsSidebar.tsx | no-restricted-syntax | 606 | ❌ Direct 'router.push/replace' in render body is dangerous. Wrap in 'useEffect' or event handler. |
| frontend/src/components/user/SafetyTips.tsx | @typescript-eslint/no-explicit-any | 32 | Unexpected any. Specify a different type. |
| frontend/src/components/user/StaticPages.tsx | @typescript-eslint/no-explicit-any | 94 | Unexpected any. Specify a different type. |
| frontend/src/components/user/business-registration/StepBasicDetails.tsx | next/no-img-element | 158 | Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element |
| frontend/src/components/user/parts/PartWizardContext.tsx | no-restricted-syntax | 264 | ❌ Direct 'router.push/replace' in render body is dangerous. Wrap in 'useEffect' or event handler. |
| frontend/src/components/user/parts/steps/Step2PartPricing.tsx | next/no-img-element | 56 | Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element |
| frontend/src/components/user/post-ad/steps/Step2DeviceStatus.tsx | next/no-img-element | 298 | Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element |
| frontend/src/components/user/services/ServiceWizardContext.tsx | no-restricted-syntax | 341 | ❌ Direct 'router.push/replace' in render body is dangerous. Wrap in 'useEffect' or event handler. |
| frontend/src/components/user/services/steps/Step2ServicePricing.tsx | next/no-img-element | 114 | Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element |
| frontend/src/hooks/useAdSearch.ts | no-restricted-syntax | 47 | ❌ Direct 'router.push/replace' in render body is dangerous. Wrap in 'useEffect' or event handler. |
