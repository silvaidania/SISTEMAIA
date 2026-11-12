import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listAcademicPeriods,
  getAcademicPeriodById,
  createAcademicPeriod,
  updateAcademicPeriod,
  deleteAcademicPeriod
} from '../services/academicPeriodsManagement.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin', 'coordinator'), async (req, res, next) => {
  try {
    const { universityId, isActive, search } = req.query;
    const periods = await listAcademicPeriods({
      universityId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search
    });
    return res.json({ periods });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, requireRole('admin', 'coordinator'), async (req, res, next) => {
  try {
    const period = await getAcademicPeriodById(req.params.id);
    return res.json({ period });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { universityId, name, startDate, endDate } = req.body || {};

    if (!universityId || !name || !startDate || !endDate) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const period = await createAcademicPeriod({ universityId, name, startDate, endDate });
    return res.status(201).json({ period });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { universityId, name, startDate, endDate, isActive } = req.body || {};
    const period = await updateAcademicPeriod(req.params.id, { universityId, name, startDate, endDate, isActive });
    return res.json({ period });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    await deleteAcademicPeriod(req.params.id);
    return res.json({ message: 'Periodo académico eliminado correctamente' });
  } catch (error) {
    next(error);
  }
});

export default router;
