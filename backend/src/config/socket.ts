/**
 * Socket.io Gateway
 *
 * Initialised once in server.ts after the HTTP server is created.
 * All other modules call getIO() to emit events — safe to use in
 * workers/services because the try/catch in NotificationDispatcher
 * already swallows errors when socket is unavailable (e.g. tests).
 */

import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import logger from '../utils/logger';
import { verifyToken } from '../utils/auth';
import redisClient from '../utils/redisCache';
import { getAllowedOriginList } from '../utils/originConfig';
import { env } from './env';

let io: Server | null = null;

/**
 * Initialise the socket.io server and attach it to the HTTP server.
 * Must be called before startListening().
 */
export function initIO(httpServer: HttpServer): Server {
    const corsOrigins = getAllowedOriginList({
        NODE_ENV: env.NODE_ENV,
        CORS_ORIGIN: env.CORS_ORIGIN,
        COOKIE_DOMAIN: env.COOKIE_DOMAIN,
        FRONTEND_URL: env.FRONTEND_URL,
        FRONTEND_INTERNAL_URL: env.FRONTEND_INTERNAL_URL,
        ADMIN_FRONTEND_URL: env.ADMIN_FRONTEND_URL,
        ADMIN_URL: env.ADMIN_URL,
    });

    io = new Server(httpServer, {
        cors: {
            origin: corsOrigins,
            credentials: true,
        },
        // We start with polling and upgrade to websocket for maximum compatibility
        // behind various browser/proxy configurations.
        transports: ['polling', 'websocket'],
        // Prevent lingering connections from blocking a graceful shutdown.
        connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 },
    });

    // ── Redis adapter for horizontal scaling ─────────────────────────────────
    try {
        // socket.io redis adapter needs a *second* dedicated client for subscribe.
        const pubClient = redisClient;
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Redis = require('ioredis');
        const subClient = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379') as typeof redisClient;
        io.adapter(createAdapter(pubClient as any, subClient as any));
        logger.info('[Socket] Redis adapter attached');
    } catch (err) {
        logger.warn('[Socket] Redis adapter unavailable — falling back to in-memory', {
            error: err instanceof Error ? err.message : String(err),
        });
    }

    // ── Auth middleware ───────────────────────────────────────────────────────
    io.use((socket: Socket, next) => {
        try {
            const extractUserId = (token: string): string => {
                const payload = verifyToken(token);
                if (!payload) return '';
                return String((payload as Record<string, unknown>).id ?? '');
            };

            // 1. Try Authorization header (Bearer token)
            const authHeader = socket.handshake.headers.authorization;
            if (authHeader?.startsWith('Bearer ')) {
                (socket as any).userId = extractUserId(authHeader.slice(7));
                return next();
            }

            // 2. Try cookie
            const rawCookie: string = (socket.handshake.headers.cookie as string) ?? '';
            const match = rawCookie.match(/esparex_auth=([^;]+)/);
            if (match?.[1]) {
                (socket as any).userId = extractUserId(decodeURIComponent(match[1]));
                return next();
            }

            // 3. Try auth.token
            const queryToken = socket.handshake.auth?.token as string | undefined;
            if (queryToken) {
                (socket as any).userId = extractUserId(queryToken);
                return next();
            }

            // Allow anonymous connections to prevent frontend errors
            // Use property check on socket to determine auth status in connection handler
            return next();
        } catch {
            // Even on token error, we allow the connection to stay alive (anonymous)
            return next();
        }
    });

    // ── Connection handler ───────────────────────────────────────────────────
    io.on('connection', (socket: Socket) => {
        const userId: string | undefined = (socket as any).userId;
        
        if (userId) {
            // Join a private room named after the user's ID
            void socket.join(userId);
            logger.debug(`[Socket] Authenticated user connected`, { userId, socketId: socket.id });
        } else {
            logger.debug(`[Socket] Anonymous guest connected`, { socketId: socket.id });
        }

        socket.on('disconnect', (reason) => {
            logger.debug(`[Socket] Client disconnected`, { userId: userId || 'anonymous', reason });
        });
    });

    logger.info('[Socket] Socket.io server initialised');
    return io;
}

/**
 * Return the active socket.io Server instance.
 * Throws if called before initIO().
 */
export function getIO(): Server {
    if (!io) {
        throw new Error('[Socket] getIO() called before initIO(). Ensure initIO(httpServer) runs in server.ts.');
    }
    return io;
}

/**
 * Graceful shutdown — closes all connections cleanly.
 */
export async function closeIO(): Promise<void> {
    if (!io) return;
    await new Promise<void>((resolve) => io!.close(() => resolve()));
    io = null;
    logger.info('[Socket] Socket.io server closed');
}
