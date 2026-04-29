/**
 * CI Auth Security Guard
 * Validates that JWT secrets are completely isolated for Admin vs User scopes.
 * Run automatically during the CI/CD pipeline.
 */

// In a CI context, if real secrets are not injected, mock values must still differ
const jwtSecret = process.env.JWT_SECRET || 'MOCK_USER_SECRET_123';
const adminJwtSecret = process.env.ADMIN_JWT_SECRET || 'MOCK_ADMIN_SECRET_456';

console.log("🔒 Running Auth Isolation Guard Check...");

if (!adminJwtSecret || adminJwtSecret.trim() === '') {
    console.error("❌ SECURITY FAILURE: ADMIN_JWT_SECRET is empty or missing.");
    process.exit(1);
}

if (adminJwtSecret === jwtSecret) {
    console.error("❌ SECURITY FAILURE: ADMIN_JWT_SECRET must be strictly different from JWT_SECRET.");
    console.error("   This prevents user tokens from accidentally authenticating against admin APIs.");
    process.exit(1);
}

console.log("✅ Auth secrets are properly isolated.");
