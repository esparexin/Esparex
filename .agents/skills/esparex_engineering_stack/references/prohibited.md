# Not Approved for Use (Unless Approved by ADR)

This reference outlines technologies and libraries that are **not approved for use** in the Esparex repository unless explicitly introduced through an approved Architectural Decision Record (ADR) or project-specific exception.

---

## 1. Not Approved Form & Validation Libraries
- **Banned Form Libraries**: Formik, Yup, Formsy, React Final Form. Standardize on **React Hook Form (RHF)**.
- **Banned Validation Engines**: Joi, Superstruct. Standardize on **Zod** (`zod`).
- **Constraint**: Forms must never bypass shared Zod validator schemas or hardcode validation boundaries locally.

---

## 2. Not Approved State Management Libraries
- **Banned Store Managers**: Redux Toolkit, MobX, Recoil, Zustand.
- **Convention**: Use React Context / `useState` for visual UI properties, and TanStack Query (`@tanstack/react-query`) for cache state synchronization.

---

## 3. Not Approved Database Layers
- **Banned ORMs**: Prisma, TypeORM, Sequelize.
- **Convention**: Standardize on **Mongoose / MongoDB**. Do not run raw MongoDB driver clients outside of core model contexts.

---

## 4. Not Approved Styling & HTTP Libraries
- **Banned CSS-in-JS Libraries**: Styled Components, Emotion, styled-jsx. These libraries hurt initial load performance on Server Components. Use CSS Modules and Tailwind classes.
- **Banned Local HTTP Clients**: Custom Axios instance declarations in isolated app views. Consume from the consolidated API layer in apps instead.
