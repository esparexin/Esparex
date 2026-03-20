# 07_FRONTEND_SYSTEM_RULES — UI Engineering Standards

## ⚛️ Component Architecture
- **Composition over Inheritance**: Build complex UIs using small, reusable functional components.
- **Logic Isolation**: Custom hooks (e.g., `useAds`, `useAuth`) must encapsulate complex state and side effects.
- **Prop Typing**: All components must use strict TypeScript interfaces for props.

---

## 📝 Form Handling
- **Unified Library**: Use `React Hook Form` (RHF) for all form management.
- **Validation**: Zod is the canonical schema validation library for both frontend forms and API responses.
- **Error Display**: Consistent error messaging using a designated `FormFieldError` component.

---

## 📍 Location & Search Pipeline
- **SSOT Location**: User location is stored and retrieved from the `LocationContext`.
- **IP Fallback**: If browser geolocation fails, the system must fallback to IP-based location resolution.
- **Radius Search**: Search results are filtered based on a hierarchy: `Pincode` → `City` → `District`.

---

## 🚀 Performance & SSR
- **Server Components**: Use Next.js Server Components for static/SEO-heavy content (e.g., Ad details).
- **Client Components**: Restrict use to interactive elements (e.g., Maps, Forms, Modals).
- **Image Optimization**: Always use the Next.js `<Image />` component with configured remote patterns for S3 compatibility.
