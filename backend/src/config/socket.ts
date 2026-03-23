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

let io: Server | null = null;

/**
 * Initialise the socket.io server and attach it to the HTTP server.
 * Must be called before startListening().
 */
export function initIO(httpServer: HttpServer): Server {
    io = new Server(httpServer, {
        cors: {
            origin: [
                process.env.FRONTEND_URL ?? 'http://localhost:3000',
                process.env.ADMIN_FRONTEND_URL ?? 'http://localhost:3001',
            ],
            credentials: true,
        },
        // Use long-polling fallback so it works behind reverse proxies that
        // don't support WebSocket upgrades out of the box.
        transports: ['websocket', 'polling'],
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
                if (!payload) throw new Error('Invalid token');
                return String((payload as Record<string, unknown>).id ?? '');
            };

            // 1. Try Authorization header (Bearer token — used by mobile / non-cookie clients)
            const authHeader = socket.handshake.headers.authorization;
            if (authHeader?.startsWith('Bearer ')) {
                (socket as any).userId = extractUserId(authHeader.slice(7));
                return next();
            }

            // 2. Try cookie (web clients send the httpOnly cookie automatically via withCredentials)
            const rawCookie: string = (socket.handshake.headers.cookie as string) ?? '';
            const match = rawCookie.match(/esparex_auth=([^;]+)/);
            if (match?.[1]) {
                (socket as any).userId = extractUserId(decodeURIComponent(match[1]));
                return next();
            }

            // 3. Try auth.token handshake field (passed explicitly by socket.io-client)
            const queryToken = socket.handshake.auth?.token as string | undefined;
            if (queryToken) {
                (socket as any).userId = extractUserId(queryToken);
                return next();
            }

            next(new Error('Authentication required'));
        } catch {
            next(new Error('Invalid token'));
        }
    });

    // ── Connection handler ───────────────────────────────────────────────────
    io.on('connection', (socket: Socket) => {
        const userId: string = (socket as any).userId;
        if (!userId) {
            socket.disconnect(true);
            return;
        }

        // Join a private room named after the user's ID so we can target
        // individual users with getIO().to(userId).emit(...)
        void socket.join(userId);
        logger.debug(`[Socket] User connected`, { userId, socketId: socket.id });

        socket.on('disconnect', (reason) => {
            logger.debug(`[Socket] User disconnected`, { userId, reason });
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
