# Esparex Admin Panel UX Standards

The Admin Panel (`apps/admin`) serves platform operators, moderators, and financial admins.
Its primary goals are **high information density, fast scannability, low cognitive overhead, and keyboard efficiency**.

---

## 1. Information Density & Layout

- **Compact Spacing**: Use `space-y-4` and `p-4`–`p-6` for table cards. Avoid consumer-marketplace wide gaps (`space-y-12`).
- **Typography Sizing**: Data tables and form controls use `small` (`13px`) and `caption` (`12px`) body text for maximum scannability.
- **KPI Summary Cards**: Top metrics dashboard uses a 4-card responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).

---

## 2. Data Tables (`DataTable`)

- **Header Alignment**: Left-align text columns, right-align numeric/currency columns, center status chips.
- **Status Chips**: Use canonical status color coding:
  - Active / Success: Emerald (`bg-emerald-50 text-emerald-700 border-emerald-200`)
  - Pending / Warning: Amber (`bg-amber-50 text-amber-700 border-amber-200`)
  - Suspended / Error: Red (`bg-red-50 text-red-700 border-red-200`)
  - Draft / Muted: Slate (`bg-slate-100 text-slate-700 border-slate-200`)
- **Pagination**: Include row count indicator ("Showing 1 to 25 of 142 items") and explicit Page Previous/Next buttons.

---

## 3. Admin Toolbar (`AdminFilterToolbar`)

- Include Search Input (`placeholder="Search by name, ID, or email..."`), status filter select, date range filter, and Primary Action CTA ("New Campaign", "Export CSV").
- Provide a "Clear Filters" button when active filters exist.
