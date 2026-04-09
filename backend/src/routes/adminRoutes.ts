/**
 * ADMIN ROUTES — AGGREGATE ENTRY POINT
 *
 * Public (unauthenticated) auth endpoints are on publicRouter.
 * All protected routes are composed from domain sub-modules:
 *
 *   routes/admin/moderation.routes.ts  — Ads, Reports, Services, Parts, Chat
 *   routes/admin/catalog.routes.ts     — Categories, Brands, Models, Spare Parts, Screen Sizes
 *   routes/admin/system.routes.ts      — Users, Sessions, Plans, Business, Locations, Config
 *   routes/admin/finance.routes.ts     — Transactions, Invoices, Smart Alerts
 */
import express from 'express';
import { requireAdmin } from '../middleware/adminAuth';
import { adminLimiter, otpIpLimiter } from '../middleware/rateLimiter';
import { setupQueueDashboard } from '../queues/queueDashboard';
import * as systemController from '../controllers/admin/system';
import { getCsrfToken, setCsrfToken } from '../middleware/csrfProtection';

import moderationRoutes from './admin/moderation.routes';
import catalogRoutes from './admin/catalog.routes';
import systemRoutes from './admin/system.routes';
import financeRoutes from './admin/finance.routes';
import importRoutes from './importRoutes';



// ============================================
// PUBLIC ROUTER (No auth required)
// ============================================
export const publicRouter = express.Router();


// Canonical auth routes
publicRouter.post('/auth/login', otpIpLimiter, systemController.login);
publicRouter.post('/auth/logout', systemController.logout);
publicRouter.post('/auth/forgot-password', otpIpLimiter, systemController.forgotPassword);
publicRouter.put('/auth/reset-password/:token', otpIpLimiter, systemController.resetPassword);
// Backward-compatible contract aliases
publicRouter.post('/forgot-password', otpIpLimiter, systemController.forgotPassword);
publicRouter.put('/reset-password/:token', otpIpLimiter, systemController.resetPassword);

// Canonical CSRF Discovery
publicRouter.get('/csrf-token', setCsrfToken, getCsrfToken);

// ============================================
// PROTECTED ROUTER — requireAdmin gate
// ============================================
const router = express.Router();
router.use(requireAdmin);
router.use(adminLimiter);

// Admin identity
router.get('/me', systemController.getMe);

// Queue dashboard
router.use('/queues', setupQueueDashboard());

// Domain route modules (zero endpoint path changes)
router.use('/', systemRoutes);
router.use('/', moderationRoutes);
router.use('/', catalogRoutes);
router.use('/', financeRoutes);
router.use('/import', importRoutes);

export default router;
