import express from 'express';
import cors from 'cors';
import { env } from '../config/env.js';
import authRoutes from './auth.js';
import loadBalanceRoutes from './loadBalance.js';

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/load-balance', loadBalanceRoutes);

export function createApiRouter() {
  return router;
}

export const allowedOrigins = [
  env.corsOrigin,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true
};
