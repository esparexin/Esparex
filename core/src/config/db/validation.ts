import logger from '../../utils/logger';
import { env } from '../env';

const isProd = env.NODE_ENV === 'production';

export function validateDatabaseUris(): { userDbUri: string; adminDbUri: string } {
    if (isProd && !env.MONGODB_URI) {
        throw new Error('❌ MONGODB_URI is required in production');
    }

    if (isProd && !env.ADMIN_MONGODB_URI) {
        throw new Error('❌ ADMIN_MONGODB_URI is required in production');
    }

    if (isProd) {
        const mongoUri = env.MONGODB_URI;
        const adminUri = env.ADMIN_MONGODB_URI;

        const validateUri = (uri: string | undefined, label: string) => {
            if (!uri) return;
            if (uri.includes('root:')) {
                throw new Error(`🚨 SECURITY ERROR: Root user detected in ${label} MONGODB_URI. Use a least-privilege DB user.`);
            }
            if (!uri.includes('tls=true') && !uri.includes('ssl=true')) {
                logger.warn(`⚠️  SECURITY: ${label} MONGODB_URI should enforce tls=true or ssl=true in production.`);
            }
            if (!uri.includes('authMechanism=SCRAM')) {
                logger.warn(`⚠️  SECURITY: ${label} MONGODB_URI should explicitly use authMechanism=SCRAM-SHA-256 for secure handshakes.`);
            }
        };

        validateUri(mongoUri, 'Main');
        
        if (adminUri !== mongoUri) {
            validateUri(adminUri, 'Admin');
        }
    }

    const userDbUri = env.MONGODB_URI || 'mongodb://localhost:27017/esparex_user';
    const adminDbUri = env.ADMIN_MONGODB_URI || 'mongodb://localhost:27017/esparex_admin';

    if (!env.MONGODB_URI) {
        logger.warn('Using local User MongoDB (development mode)');
    }

    if (!env.ADMIN_MONGODB_URI) {
        logger.warn('ADMIN_MONGODB_URI not set. Using local Admin MongoDB default (development mode).');
    }

    if (env.MONGODB_URI && env.ADMIN_MONGODB_URI && env.MONGODB_URI === env.ADMIN_MONGODB_URI) {
        logger.warn('User and Admin databases point to the same URI. Split architecture is disabled for this runtime.');
    }

    return { userDbUri, adminDbUri };
}
