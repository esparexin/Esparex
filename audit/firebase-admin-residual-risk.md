# Firebase Admin Residual Audit Risk

Snapshot date: 2026-04-10

Current audit status:
- `8 low`
- `0 moderate`
- `0 high`
- `0 critical`

Remaining low-severity findings are all inside the `firebase-admin` dependency chain used by the backend push-notification path.

Current resolved versions:
- `firebase-admin@13.8.0`
- `@google-cloud/firestore@7.11.6`
- `@google-cloud/storage@7.19.0`
- `google-gax@4.6.1`
- `retry-request@7.0.2`
- `teeny-request@9.0.0`
- `http-proxy-agent@5.0.0`
- `@tootallnate/once@2.0.0`

Why this remains:
- `firebase-admin@13.8.0` is the latest published version currently available.
- The transitive packages above are already at the newest versions available within the semver ranges allowed by the installed Google/Firebase packages.
- Clearing the remaining audit items would require forcing unsupported transitive majors or replacing the Firebase Admin push stack.

Decision:
- Do not override these packages beyond their declared compatible ranges.
- Treat the remaining lows as upstream residual risk until Firebase/Google publish compatible fixes.

Runtime coverage added for the affected code paths:
- `backend/src/__tests__/config/firebaseAdmin.spec.ts`
- `backend/src/__tests__/services/NotificationService.spec.ts`

Revisit when:
- a newer `firebase-admin` release is published, or
- the backend push provider changes away from Firebase Admin.
