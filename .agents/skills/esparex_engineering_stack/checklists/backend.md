# Backend Integration Checklist

Verify each requirement is satisfied before requesting code review:

- [ ] **Thin Controller**: Route controller only handles extraction, validator middleware triggers, and response envelopes.
- [ ] **Request Validator**: Every endpoint validates its route params, query variables, and request body using Zod.
- [ ] **No Inline DB Queries**: No direct Mongoose queries run inside controller handlers.
- [ ] **Response Envelopes**: Errors and successes use the unified JSON envelope wrapper schemas.
- [ ] **Error Safety**: Custom codes are mapped to standard HTTP statuses.
