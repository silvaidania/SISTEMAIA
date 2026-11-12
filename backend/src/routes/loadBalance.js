import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getReviewerBalance, getAssignableReviewers, assignReviewerWithBalance } from '../services/loadBalance.js';

const router = Router();

router.get('/reviewers', requireAuth, requireRole('admin', 'coordinator'), async (_req, res, next) => {
  try {
    const reviewers = await getAssignableReviewers();
    return res.json({ reviewers });
  } catch (error) {
    next(error);
  }
});

router.get('/balance', requireAuth, requireRole('admin', 'coordinator', 'reviewer'), async (_req, res, next) => {
  try {
    const balance = await getReviewerBalance();
    return res.json({ balance });
  } catch (error) {
    next(error);
  }
});

router.post('/assign', requireAuth, requireRole('admin', 'coordinator'), async (req, res, next) => {
  try {
    const { documentId } = req.body || {};

    if (!documentId) {
      return res.status(400).json({ message: 'documentId es obligatorio' });
    }

    const assignment = await assignReviewerWithBalance(documentId, req.user.userId);
    return res.status(201).json({ assignment });
  } catch (error) {
    next(error);
  }
});

export default router;
