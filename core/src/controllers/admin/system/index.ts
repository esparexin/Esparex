/**
 * Admin System Controller - Re-export Index
 * Maintains backward compatibility by re-exporting all functions
 * from the split admin controllers
 */

// Export all auth functions
export {
    forgotPassword,
    resetPassword,
    adminLogin,
    adminLogout,
    getMe,
    login,
    logout
} from './adminAuthController';

// Export all system health functions
export {
    getCacheHealth,
    getSystemHealth,
    runSystemScan,
    applySystemFix
} from './adminSystemHealthController';

// Export all dashboard functions
export {
    getStats,
    getDashboardStats,
    getAnalytics,
    getRecentActivity,
    getContactSubmissions,
    updateContactSubmissionStatus,
    getRateLimitMetrics,
    getLocationAnalytics
} from './adminDashboardController';
