import { client, isConnected } from './config';
import logger from '../logger';

export const blacklistToken = async (jti: string, exp: number) => {
    if (!isConnected || !jti) return;
    try {
        const now = Math.floor(Date.now() / 1000);
        const ttl = exp - now;
        if (ttl > 0) await client.set(`blacklist:token:${jti}`, 'revoked', 'EX', ttl);
    } catch (e) { logger.error('Failed to blacklist JWT in Redis', e); }
};

export const isTokenBlacklisted = async (jti: string): Promise<boolean> => {
    if (!isConnected || !jti) return false;
    try { const res = await client.get(`blacklist:token:${jti}`); return res === 'revoked'; }
    catch { return false; }
};
