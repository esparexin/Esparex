// Public API barrel for the {{Name}} bounded context.
//
// Export only what consumers are permitted to access.
// Internal domain internals (domain/, ports/ sub-paths) must never be
// imported directly from outside this bounded context.
//
// Example:
//   export { {{Name}}Service } from './application/{{Name}}Service';
//   export type { {{Name}}RepositoryPort } from './ports/{{Name}}RepositoryPort';
