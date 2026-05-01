/**
 * Standardized Toast Messages
 * Use these constants to ensure consistency across the application.
 */

export const TOAST_MESSAGES = {
    // Generic Actions
    ACTION_SUCCESS: "Action completed successfully",
    ACTION_FAILED: "Action failed. Please try again",

    // Data Loading
    LOAD_SUCCESS: "Data loaded successfully",
    LOAD_FAILED: "Failed to load data",

    // Form Submission
    SUBMIT_SUCCESS: "Submitted successfully",
    SUBMIT_FAILED: "Submission failed",
    VALIDATION_ERROR: "Please check your input and try again",
    VALIDATION_REQUIRED: "Please fill in all required fields",

    // Authentication
    LOGIN_SUCCESS: "Logged in successfully",
    LOGIN_FAILED: "Login failed. Please check your credentials",
    LOGOUT_SUCCESS: "Logged out successfully",
    SESSION_EXPIRED: "Session expired. Please log in again",

    // Resources (Create/Update/Delete)
    CREATE_SUCCESS: "Created successfully",
    UPDATE_SUCCESS: "Updated successfully",
    DELETE_SUCCESS: "Deleted successfully",
    SAVE_DRAFT_SUCCESS: "Draft saved successfully",

    // File Upload
    UPLOAD_SUCCESS: "File uploaded successfully",
    UPLOAD_FAILED: "File upload failed",
    FILE_TOO_LARGE: "File is too large. Maximum size is 5MB",

    // Network
    NETWORK_ERROR: "Network error. Please check your connection",
    OFFLINE_MODE: "You are currently offline",

    // Profile
    PROFILE_UPDATED: "Profile updated successfully",
    PASSWORD_UPDATED: "Password updated successfully",

    // Clipboard
    COPY_SUCCESS: "Copied to clipboard",
    COPY_FAILED: "Failed to copy to clipboard",

    // Admin Specific
    ADMIN_ACCESS_DENIED: "You do not have permission to access this area",
    FEATURE_DISABLED: "This feature is currently disabled",
} as const;
