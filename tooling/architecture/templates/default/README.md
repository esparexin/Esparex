# {{Name}} Domain

## Purpose

<!-- Describe the business capability this bounded context is responsible for. -->

## Owner

{{owner}}

## Dependencies

<!-- List other bounded contexts or packages this domain depends on. -->
- `@esparex/shared`
- `core/shared-kernel`

## Public API

All public exports are declared in [`index.ts`](./index.ts).
Consumers must import only from the root barrel — never from internal sub-paths.

## Architecture

This domain follows the Esparex Hexagonal Architecture pattern:

```
{{id}}/
├── application/     # Use-case orchestration (services, commands, queries)
├── domain/          # Pure business logic (entities, services, policies, events)
├── ports/           # Hexagonal port interfaces (RepositoryPort, GatewayPort)
├── index.ts         # Public barrel — only entry point for consumers
└── manifest.yaml    # Domain metadata and ownership declaration
```

Adapters (Mongoose repositories, external SDKs) live in
`core/adapters/outbound/database/{{id}}/` and implement the port interfaces
declared here.
