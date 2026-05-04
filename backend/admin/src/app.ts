import '@esparex/core/config/loadEnv'; // MUST BE FIRST (Registers Aliases)
import { initSentry } from '@esparex/core/config/sentry'; // Initialize Sentry early
import express, { type RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import '@esparex/core/models/registry';
import { env } from '@esparex/core/config/env';

// Initialize Sentry for error tracking
initSentry();

/* -------------------------------------------------------------------------- */
/* ROUTES                                                                      */
/* -------------------------------------------------------------------------- */
import adminRoutes, { publicRouter as adminPublicRoutes } from './routes/adminRoutes';

/* -------------------------------------------------------------------------- */
/* MIDDLEWARE                                                                  */
/* -------------------------------------------------------------------------- */
import { globalLimiter } from './middleware/rateLimiter';
import { requireDb } from './middleware/requireDb';
import { maintenanceMiddleware } from './middleware/maintenanceMiddleware';
import { enforceErrorResponseContract } from './middleware/errorResponseContract';

/* -------------------------------------------------------------------------- */
/* DB / HEALTH                                                                 */
/* -------------------------------------------------------------------------- */
import { isDbReady } from '@esparex/core/config/db';
import { getAllowedOriginList, normalizeOrigin } from '@esparex/core/utils/originConfig';

/* -------------------------------------------------------------------------- */
/* APP INIT                                                                    */
/* -------------------------------------------------------------------------- */
const app = express();
app.disable("x-powered-by");
const ADMIN_API_V1_PREFIX = '/api/v1/admin';

app.set('trust proxy', 1);

/* -------------------------------------------------------------------------- */
/* CORS CONFIG                                                                 */
/* -------------------------------------------------------------------------- */
const whitelist = getAllowedOriginList(env);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalized = normalizeOrigin(origin);
        if (whitelist.includes(normalized)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS Error: Origin ${normalized} not allowed`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'x-otp-token']
}));

/* -------------------------------------------------------------------------- */
/* BASIC MIDDLEWARE                                                            */
/* -------------------------------------------------------------------------- */
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    skip: (req) => req.path === '/health'
}));

// Body parsing
const rawParser = express.raw({ type: 'application/json' }) as RequestHandler;
app.use((req, res, next) => {
    if (req.originalUrl === '/api/v1/payment/webhook') {
        rawParser(req, res, next);
    } else {
        express.json({ limit: '10mb' })(req, res, next);
    }
});

app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(globalLimiter);

/* -------------------------------------------------------------------------- */
/* HEALTH                                                                      */
/* -------------------------------------------------------------------------- */
app.get('/health', (req, res) => {
    if (isDbReady()) {
        res.status(200).json({ status: 'ok', db: 'connected', service: 'backend/admin' });
    } else {
        res.status(503).json({ status: 'error', db: 'disconnected', service: 'backend/admin' });
    }
});

/* -------------------------------------------------------------------------- */
/* MAINTENANCE MODE                                                            */
/* -------------------------------------------------------------------------- */
app.use(maintenanceMiddleware);

/* -------------------------------------------------------------------------- */
/* ROUTES MOUNTING                                                             */
/* -------------------------------------------------------------------------- */
app.use(requireDb);

app.use(enforceErrorResponseContract);

app.use(ADMIN_API_V1_PREFIX, adminPublicRoutes);
app.use(ADMIN_API_V1_PREFIX, adminRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: `Route not found: ${req.originalUrl}`,
            code: 'NOT_FOUND'
        }
    });
});

/* -------------------------------------------------------------------------- */
/* ERROR HANDLING                                                              */
/* -------------------------------------------------------------------------- */


export default app;
