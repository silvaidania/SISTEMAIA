import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getSystemMetrics,
  getDocumentsByStatus,
  getDocumentsByUniversity,
  getDocumentsByPeriod,
  getReviewerPerformance,
  getStudentProgress,
  getObservationsSummary,
  getAcademicReport
} from '../services/reports.js';

const router = Router();

router.get('/metrics', requireAuth, requireRole('admin', 'coordinator'), async (_req, res, next) => {
  try {
    const metrics = await getSystemMetrics();
    return res.json({ metrics });
  } catch (error) {
    next(error);
  }
});

router.get('/documents-by-status', requireAuth, requireRole('admin', 'coordinator'), async (_req, res, next) => {
  try {
    const data = await getDocumentsByStatus();
    return res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/documents-by-university', requireAuth, requireRole('admin', 'coordinator'), async (_req, res, next) => {
  try {
    const data = await getDocumentsByUniversity();
    return res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/documents-by-period', requireAuth, requireRole('admin', 'coordinator'), async (_req, res, next) => {
  try {
    const data = await getDocumentsByPeriod();
    return res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/reviewer-performance', requireAuth, requireRole('admin', 'coordinator'), async (_req, res, next) => {
  try {
    const data = await getReviewerPerformance();
    return res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/student-progress', requireAuth, requireRole('admin', 'coordinator'), async (_req, res, next) => {
  try {
    const data = await getStudentProgress();
    return res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/observations-summary', requireAuth, requireRole('admin', 'coordinator', 'reviewer'), async (_req, res, next) => {
  try {
    const data = await getObservationsSummary();
    return res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/academic', requireAuth, requireRole('admin', 'coordinator'), async (req, res, next) => {
  try {
    const { periodId } = req.query;
    const data = await getAcademicReport(periodId);
    return res.json({ data });
  } catch (error) {
    next(error);
  }
});

export default router;
