import express from 'express';

const router = express.Router();

// Public user-facing catalog requests are disabled.
// Admin-managed catalog requests remain functional under admin routes.

export default router;
