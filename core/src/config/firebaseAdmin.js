"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const env_1 = require("./env");
const hasFirebaseServiceAccountJson = typeof env_1.env.FIREBASE_SERVICE_ACCOUNT_JSON === 'string'
    && (env_1.env.FIREBASE_SERVICE_ACCOUNT_JSON).trim().length > 0;
const disableForTest = env_1.env.NODE_ENV === 'test' && !env_1.env.ALLOW_FIREBASE_ADMIN;
let shouldDisableFirebase = disableForTest || !hasFirebaseServiceAccountJson;
const mockAdmin = {
    apps: [],
    initializeApp: () => ({}),
    credential: {
        cert: () => ({})
    },
    messaging: () => ({
        send: () => 'mock_message_id',
        sendEachForMulticast: () => ({ successCount: 0, failureCount: 0, responses: [] })
    })
};
// Prevent multiple initializations
if (!shouldDisableFirebase && !firebase_admin_1.default.apps.length) {
    try {
        const serviceAccount = JSON.parse(env_1.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        logger_1.default.info("🔥 Firebase Admin: Using credentials from environment");
        // Clean the private key
        const privateKey = serviceAccount.private_key;
        if (typeof privateKey === 'string') {
            serviceAccount.private_key = privateKey.replace(/\\n/g, '\n').trim();
        }
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount)
        });
        logger_1.default.info("✅ Firebase Admin Initialized");
    }
    catch (error) {
        logger_1.default.error("❌ Firebase Admin Init Failed:", error instanceof Error ? error.message : String(error));
        shouldDisableFirebase = true;
    }
}
if (!hasFirebaseServiceAccountJson && !disableForTest) {
    logger_1.default.warn('Firebase Admin disabled: FIREBASE_SERVICE_ACCOUNT_JSON is not set.');
}
const firebaseAdmin = shouldDisableFirebase ? mockAdmin : firebase_admin_1.default;
exports.default = firebaseAdmin;
//# sourceMappingURL=firebaseAdmin.js.map