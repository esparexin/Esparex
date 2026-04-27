"use strict";
/**
 * Socket.io Gateway
 *
 * Initialised once in server.ts after the HTTP server is created.
 * All other modules call getIO() to emit events — safe to use in
 * workers/services because the try/catch in NotificationDispatcher
 * already swallows errors when socket is unavailable (e.g. tests).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initIO = initIO;
exports.getIO = getIO;
exports.closeIO = closeIO;
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const auth_1 = require("@core/utils/auth");
const redisCache_1 = __importDefault(require("@core/utils/redisCache"));
const originConfig_1 = require("@core/utils/originConfig");
const env_1 = require("./env");
let io = null;
/**
 * Initialise the socket.io server and attach it to the HTTP server.
 * Must be called before startListening().
 */
function initIO(httpServer) {
    const corsOrigins = (0, originConfig_1.getAllowedOriginList)({
        NODE_ENV: env_1.env.NODE_ENV,
        CORS_ORIGIN: env_1.env.CORS_ORIGIN,
        COOKIE_DOMAIN: env_1.env.COOKIE_DOMAIN,
        FRONTEND_URL: env_1.env.FRONTEND_URL,
        FRONTEND_INTERNAL_URL: env_1.env.FRONTEND_INTERNAL_URL,
        ADMIN_FRONTEND_URL: env_1.env.ADMIN_FRONTEND_URL,
        ADMIN_URL: env_1.env.ADMIN_URL,
    });
    io = new socket_io_1.Server(httpServer, {
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
        const pubClient = redisCache_1.default;
        const subClient = new ioredis_1.default(env_1.env.REDIS_URL ?? `redis://localhost:${env_1.env.REDIS_PORT}`, {
            tls: undefined, // 🔒 FORCE DISABLE TLS
        });
        io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
        logger_1.default.info('[Socket] Redis adapter attached');
    }
    catch (err) {
        logger_1.default.warn('[Socket] Redis adapter unavailable — falling back to in-memory', {
            error: err instanceof Error ? err.message : String(err),
        });
    }
    // ── Auth middleware ───────────────────────────────────────────────────────
    io.use((socket, next) => {
        try {
            const extractUserId = (token) => {
                const payload = (0, auth_1.verifyToken)(token);
                if (!payload)
                    return '';
                return String(payload.id ?? '');
            };
            // 1. Try Authorization header (Bearer token)
            const authHeader = socket.handshake.headers.authorization;
            if (authHeader?.startsWith('Bearer ')) {
                socket.userId = extractUserId(authHeader.slice(7));
                return next();
            }
            // 2. Try cookie
            const rawCookie = socket.handshake.headers.cookie ?? '';
            const match = rawCookie.match(/esparex_auth=([^;]+)/);
            if (match?.[1]) {
                socket.userId = extractUserId(decodeURIComponent(match[1]));
                return next();
            }
            // 3. Try auth.token
            const queryToken = socket.handshake.auth?.token;
            if (queryToken) {
                socket.userId = extractUserId(queryToken);
                return next();
            }
            // Allow anonymous connections to prevent frontend errors
            // Use property check on socket to determine auth status in connection handler
            return next();
        }
        catch {
            // Even on token error, we allow the connection to stay alive (anonymous)
            return next();
        }
    });
    // ── Connection handler ───────────────────────────────────────────────────
    io.on('connection', (socket) => {
        const userId = socket.userId;
        if (userId) {
            // Join a private room named after the user's ID
            void socket.join(userId);
            logger_1.default.debug(`[Socket] Authenticated user connected`, { userId, socketId: socket.id });
        }
        else {
            logger_1.default.debug(`[Socket] Anonymous guest connected`, { socketId: socket.id });
        }
        socket.on('disconnect', (reason) => {
            logger_1.default.debug(`[Socket] Client disconnected`, { userId: userId || 'anonymous', reason });
        });
    });
    logger_1.default.info('[Socket] Socket.io server initialised');
    return io;
}
/**
 * Return the active socket.io Server instance.
 * Throws if called before initIO().
 */
function getIO() {
    if (!io) {
        throw new Error('[Socket] getIO() called before initIO(). Ensure initIO(httpServer) runs in server.ts.');
    }
    return io;
}
/**
 * Graceful shutdown — closes all connections cleanly.
 */
async function closeIO() {
    if (!io)
        return;
    await new Promise((resolve) => { void io.close(() => resolve()); });
    io = null;
    logger_1.default.info('[Socket] Socket.io server closed');
}
//# sourceMappingURL=socket.js.map