# Domain Migration Guide

This guide outlines the standard process for migrating business domains into the Enterprise Architecture.

## Principles
1. **Bounded Context**: Each domain must be self-contained.
2. **Loose Coupling**: Domains communicate via well-defined ports.
3. **Explicit Dependencies**: Direct dependency on persistence models or infrastructure is forbidden within the domain layer.

## Migration Workflow
1. **Scaffold**: Use the `tools/templates/domain-package` template.
2. **Define Ports**: Identify the interfaces required by the domain.
3. **Migrate Logic**: Move code incrementally from `core` to the new package.
4. **Validation**: Must pass Build, Type-check, and Dependency-Cruiser tests.

## Definition of Done
- All functionality is preserved.
- Zero functional changes.
- All tests pass.
- Architecture rules satisfied.
