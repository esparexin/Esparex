# Phase 9: Frontend Audit Report

## 1. Executive Summary
A frontend audit of the `@esparex/apps-web` workspace (customer portal) was conducted. The application is a Next.js project using Tailwind CSS, Radix UI, Vitest, and Playwright. The audit identified a high-severity configuration mismatch where the remote image pattern loader points to an empty constants file rather than the canonical registry, and discovered committed Playwright screenshots and test logs within the app's directory.

---

## 2. Scope
This audit evaluated:
- Next.js routing structure in `apps/web/src/app/`
- API proxy configuration and rewrites in `next.config.mjs`
- Remote image resolving patterns and configurations
- Committed build, test, and layout artifacts
- Redirection pathways

---

## 3. Inventory

### Core Page Routes (Next.js App Router)
- **Public Group `(public)`**:
  - `/ads` & `/ads/[id]` — Classified listing boards & item detail pages
  - `/search` — Taxonomy-indexed query view
  - `/browse-services` & `/browse-spare-parts` — Special category directories
  - `/seller/[id]` & `/about`, `/contact`, `/faq` — Utility static panels
- **Private Group `(private)`**:
  - `/account/*` (profile, settings, billing, wallet, plans) — Customer control panels
  - `/chat` — Direct real-time text thread list
  - `/post-ad`, `/edit-ad`, `/post-service`, `/post-spare-part-listing` — Item creation/editor wizards
- **Auth Group `(auth)`**:
  - `/login` & `/verify` — Mobile OTP login surfaces

### API proxy BFF Gateway
- Proxies `/api/v1/*` server-side to bypass Safari ITP cookie restrictions.
- Handles `/api/upload` endpoint locally.

---

## 4. Findings

### High Severity Findings
1. **Broken Next.js Remote Images Configuration Path**
   - **Finding**: In `apps/web/next.config.mjs` (line 7), the loader attempts to resolve remote image domains using:
     ```javascript
     const imageDomainRegistryPath = path.resolve(__dirname, '../../shared/constants/image-domain-registry.json');
     ```
     This resolves to the duplicate, empty stub registry, which returns an empty `nextRemotePatterns` list. The real domains list is located in `shared/src/constants/image-domain-registry.json`.
   - **Impact**: Any user-uploaded ad images on S3/CloudFront or placeholder graphics (e.g. placehold.co) will fail to load via the Next.js `<Image />` component, raising unconfigured hostname runtime exceptions.

2. **Committed Playwright Test Screenshots and Logs in Source**
   - **Finding**: The following debug files are checked into the Git repository:
     - `apps/web/playwright-account-profile.png` (204 KB screenshot)
     - `apps/web/playwright-account-settings.png` (182 KB screenshot)
     - `apps/web/test-output.txt` (113 KB text log)
     - `apps/web/test-output-debug.txt` (56 KB text log)
   - **Impact**: Bloats repository size and creates unnecessary churn in git histories.

---

### Medium Severity Findings
3. **Complex Redirect Configurations**
   - **Finding**: `next.config.mjs` registers over 20 legacy redirect mappings.
   - **Impact**: Increases configuration complexity, but is necessary for URL backward compatibility. These mappings should be monitored to prevent redirection loops.

---

## 5. Evidence

### Next.js Image Config Resolution Gap
In [apps/web/next.config.mjs:L7-8](file:///c:/Users/Administrator/Documents/GitHub/Esparex/apps/web/next.config.mjs#L7-L8):
```javascript
const imageDomainRegistryPath = path.resolve(__dirname, '../../shared/constants/image-domain-registry.json');
const imageDomainRegistry = JSON.parse(fs.readFileSync(imageDomainRegistryPath, 'utf8'));
```

### Committed Playwright Artifacts
- [playwright-account-profile.png](file:///c:/Users/Administrator/Documents/GitHub/Esparex/apps/web/playwright-account-profile.png)
- [playwright-account-settings.png](file:///c:/Users/Administrator/Documents/GitHub/Esparex/apps/web/playwright-account-settings.png)
- [test-output.txt](file:///c:/Users/Administrator/Documents/GitHub/Esparex/apps/web/test-output.txt)
- [test-output-debug.txt](file:///c:/Users/Administrator/Documents/GitHub/Esparex/apps/web/test-output-debug.txt)

---

## 6. Risk Level
- **Overall Frontend Risk**: **High**
- The remote images configuration path bug breaks S3 image rendering in Next.js, representing a major functional defect.

---

## 7. Recommendations
1. **Fix Image Path**: Edit `apps/web/next.config.mjs` to import `shared/src/constants/image-domain-registry.json` instead of the top-level duplicate.
2. **Remove Committed Test Logs**: Remove the committed screenshots and text output files from Git using `git rm`, and verify they are correctly intercepted by `.gitignore`.

---

## 8. Out-of-Scope Items
- E2E Test execution details (covered in Phase 14 Testing Audit).

---

## 9. Next Steps
- Update Dashboard Status.
- Proceed to **Phase 10 — Admin Audit**.
