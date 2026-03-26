import logger from './logger';

/**
 * Parse MongoDB URI to extract connection details
 */
export function parseMongoUri(uri: string) {
    try {
        const url = new URL(uri);
        const database = url.pathname.substring(1);
        const host = url.hostname;
        const port = url.port || '27017';
        const username = url.username;
        const password = url.password;

        return { host, port, database, username, password };
    } catch (error) {
        logger.error('Failed to parse MongoDB URI', { error: error instanceof Error ? error.message : String(error) });
        throw new Error('Invalid MongoDB URI');
    }
}
