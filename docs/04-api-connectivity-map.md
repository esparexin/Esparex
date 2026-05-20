# Definitive API & Environment Connectivity Map

Status: Active  
Effective Date: 2026-05-14  
Owner: Enterprise Architect

## 1. Environment Topology

| Workspace | Platform | Base URL (Production) | Key Variables |
| :--- | :--- | :--- | :--- |
| `@esparex/apps-web` | Vercel | `https://esparex.in` | `NEXT_PUBLIC_API_URL` |
| `@esparex/apps-admin` | Vercel | `https://admin.esparex.in` | `NEXT_PUBLIC_ADMIN_API_URL` |
| `@esparex/backend-user` | Render | `https://api.esparex.in` | `MONGODB_URI`, `REDIS_URL` |

## 2. API Namespace Mapping

- **Public API**: `/api/v1/*` (Handled by `backend/user`)
- **Admin API**: `/api/v1/admin/*` (Handled by `backend/user` with Admin Auth)
- **Shared Contracts**: Defined in `shared/src/contracts/api/`
- **Backward Compatibility**: All shared contracts MUST follow the safe-default policy defined in `ai-governance/SSOT.md`.

### 2.1 HTTP Method Strictness
- `GET`: Idempotent data retrieval only. No side effects.
- `POST`: Creation of new entities or complex state mutations.
- `PUT`: Complete resource replacement.
- `PATCH`: Partial resource updates.
- `DELETE`: Resource removal or soft-delete flagging.

## 3. Database Connectivity

- **User DB**: `esparex_user` (Primary operational store)
- **Admin DB**: `esparex_user` (Previously `esparex_admin`, consolidated May 2026 for `populate()` support)

## 4. External Integrations

- **OpenAI**: Primary AI provider (SEO & Identify)
- **Gemini**: Secondary AI provider (Moderation & Fallback)
- **AWS S3**: Image storage (`ap-south-1`)
- **MSG91**: OTP delivery
- **Razorpay**: Payments
