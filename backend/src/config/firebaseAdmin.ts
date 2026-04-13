import admin from 'firebase-admin';
import logger from '../utils/logger';
import { env } from './env';

const hasFirebaseServiceAccountJson = typeof env.FIREBASE_SERVICE_ACCOUNT_JSON === 'string'
    && (env.FIREBASE_SERVICE_ACCOUNT_JSON as string).trim().length > 0;
const disableForTest = env.NODE_ENV === 'test' && !env.ALLOW_FIREBASE_ADMIN;
let shouldDisableFirebase = disableForTest || !hasFirebaseServiceAccountJson;

type FirebaseServiceAccount = admin.ServiceAccount & Record<string, unknown>;

const mockAdmin = {
    apps: [],
    initializeApp: () => ({}),
    credential: {
        cert: () => ({})
    },
    messaging: () => ({
        send: async () => 'mock_message_id',
        sendEachForMulticast: async () => ({ successCount: 0, failureCount: 0, responses: [] })
    })
};

// Prevent multiple initializations
if (!shouldDisableFirebase && !admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON as string) as FirebaseServiceAccount;
        logger.info("🔥 Firebase Admin: Using credentials from environment");

        // Clean the private key
        const privateKey = serviceAccount.private_key;
        if (typeof privateKey === 'string') {
            serviceAccount.private_key = privateKey.replace(/\\n/g, '\n').trim();
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        logger.info("✅ Firebase Admin Initialized");
    } catch (error) {
        logger.error("❌ Firebase Admin Init Failed:", error instanceof Error ? error.message : String(error));
        shouldDisableFirebase = true;
    }
}

if (!hasFirebaseServiceAccountJson && !disableForTest) {
    logger.warn('Firebase Admin disabled: FIREBASE_SERVICE_ACCOUNT_JSON is not set.');
}

const firebaseAdmin = shouldDisableFirebase ? (mockAdmin as unknown as typeof admin) : admin;

export default firebaseAdmin;
