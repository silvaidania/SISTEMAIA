import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listUniversities,
  getUniversityById,
  createUniversity,
  updateUniversity,
  deleteUniversity
} from '../services/universities.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin', 'coordinator'), async (req, res, next) => {
  try {
    const { isActive, search } = req.query;
    const universities = await listUniversities({
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search
    });
    return res.json({ universities });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, requireRole('admin', 'coordinator'), async (req, res, next) => {
  try {
    const university = await getUniversityById(req.params.id);
    return res.json({ university });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, shortName } = req.body || {};

    if (!name) {
      return res.status(400).json({ message: 'El nombre es obligatorio' });
    }

    const university = await createUniversity({ name, shortName });
    return res.status(201).json({ university });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, shortName, isActive } = req.body || {};
    const university = await updateUniversity(req.params.id, { name, shortName, isActive });
    return res.json({ university });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    await deleteUniversity(req.params.id);
    return res.json({ message: 'Universidad eliminada correctamente' });
  } catch (error) {
    next(error);
  }
});

export default router;
