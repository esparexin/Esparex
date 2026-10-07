export * from './ports/UserRepositoryPort';
export * from './application/auth/AuthService';
export * from './application/users/UserService';
export * from './application/users/UserProfileService';
export * from './application/users/AdminUsersService';
export * from './application/sessions/AdminSessionService';

// ─── P1-10: consolidated re-exports (2026-10-07) ───
export * from './application/users/UserStatusService';
// Phase 3b: identity composition facade — backend auth-path middleware and
// crons consume the user repository through this port-backed singleton,
// never the User/Business Mongoose models directly.
export { userRepository } from '../../composition/identity';
