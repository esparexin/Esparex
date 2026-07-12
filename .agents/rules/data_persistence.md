---
id: data-persistence-rule
owner: rules
type: rule
version: 1.0
last_updated: 2026-07-12
depends_on: []
loads_when: ["database", "schema", "models", "migrations", "indexes"]
status: active
confidence: stable
reviewed_on: 2026-07-12
review_frequency: quarterly
replaces: []
supersedes: []
tags: []
category: architecture
---
# Data Persistence Rules

Before creating new database objects, verify:
- Existing collection
- Existing schema / model
- Existing repository or service
- Existing migration
- Existing indexes
- Existing relationships
- Existing validators / enums

Do not create duplicate collections, schemas, models, indexes, or migrations.
