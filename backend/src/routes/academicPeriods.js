import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listAcademicPeriods } from '../services/academicPeriods.js';

const router = Router();

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const periods = await listAcademicPeriods();
    return res.json({ periods });
  } catch (error) {
    next(error);
  }
});

export default router;
