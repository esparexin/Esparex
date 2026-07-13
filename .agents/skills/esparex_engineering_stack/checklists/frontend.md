# Frontend Integration Checklist

Verify each requirement is satisfied before requesting code review:

- [ ] **Form Library**: Standardize exclusively on React Hook Form. Confirm Formik or Yup are not imported.
- [ ] **Validation Origin**: Form schemas derive their boundaries (lengths, types) from Zod schemas in `@esparex/shared`.
- [ ] **Styling Rules**: Verify styling in `apps/web` uses Tailwind for structural/flex layouts and CSS Modules for custom visual tokens. Verify `apps/admin` uses Tailwind exclusively.
- [ ] **API Call Isolation**: Fetch calls originate from consolidated TanStack Query setups; no custom Axios configs in views.
- [ ] **Next.js Rendering**: Identify Server vs Client components. Verify `'use client'` is placed only when required.
- [ ] **Image Upload**: Multi-file select forms use the canonical `useListingImages` hook for hashing, compression, and S3 pre-upload.
