# Frontend App Router - Route Group Rules

This directory contains Next.js App Router pages. Route groups are used to organize routes without affecting URLs.

## Route Groups

### Admin Routes
Admin routes are no longer part of this frontend app.

They are hosted in the separate `admin-frontend` workspace and served from `admin.esparex.com`.

### `(user)/` - Authenticated User Routes
User-facing pages requiring authentication.

**Intended Pages:**
- `ads/` - Browse all ads
- `business/` - Business profile
- `messages/` - Chat/messaging
- `my-ads/` - Manage user's ads
- `my-services/` - Manage user's services
- `notifications/` - User notifications
- `post-ad/` - Create new ad
- `post-service/` - Create new service
- `account/settings/` - User account settings
- `purchases/` - Purchase history
- `saved-ads/` - Saved/favorited ads

**Layout Requirements:**
- User header with navigation
- Mobile bottom nav
- Auth guard on all pages

### `(marketing)/` - Static Marketing Pages
Public pages not requiring authentication.

**Intended Pages:**
- `about/` - About page
- `contact/` - Contact form
- `faq/` - FAQ/Help
- `how-it-works/` - Feature explanation
- `privacy/` - Privacy policy
- `safety-tips/` - Safety guidelines
- `sitemap/` - Sitemap
- `terms/` - Terms of service

**Layout Requirements:**
- Marketing header (no auth)
- Simple footer
- No sidebar

### Root Level Pages
Pages at the app root that don't fit other groups:

- `page.tsx` - Home page (`/`)
- `api/` - API routes
- `browse/` - Browse listings
- `map-search/` - Map-based search
- `login/` - Login page
- `edit-ad/` - Edit ad
- `ad-submission-success/` - Post-ad success page
- `category/` - Category pages

## Route Group Rules

### URL Structure

Route groups use parentheses `(groupName)` which are **NOT** included in the URL:

| Directory | URL Path |
|-----------|----------|
| `(user)/account/settings/` | `/account/settings` |
| `(marketing)/about/` | `/about` |
| `login/` | `/login` |

### Layout Sharing

Routes within the same route group share a `layout.tsx` if it exists in that group directory. Different route groups can have different layouts.

### Migration Guidelines

1. **Do NOT move files yet** - This structure is a framework for future refactoring
2. **Update imports gradually** - When moving files, update all imports
3. **Test after migration** - Ensure URLs remain the same
4. **Document changes** - Update this README when moving routes

## CI Guard Enforcement

This directory structure is validated by `.github/workflows/structure-lock-guard.yml`:

- ✅ Route groups exist for user and marketing pages
- ✅ This README exists with documented rules
- ✅ Route organization follows documented patterns

## Best Practices

1. **Group by Function** - Routes in same group should be related
2. **Shared Layouts** - Use route groups to share layouts between related pages
3. **URL Cleanliness** - Parentheses don't affect URLs
4. **Scalability** - Route groups make the codebase easier to navigate

## Adding New Routes

1. Determine which route group the new route belongs to
2. Create the route directory within the appropriate group
3. Create `page.tsx` in the new directory
4. Test the URL path
5. Update this README if adding a new category
