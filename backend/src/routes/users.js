import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword
} from '../services/users.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { role, isActive, search } = req.query;
    const users = await listUsers({
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search
    });
    return res.json({ users });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);
    return res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { email, password, fullName, role, studentData } = req.body || {};

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const user = await createUser({ email, password, fullName, role, studentData });
    return res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { fullName, role, isActive, reviewerCapacity } = req.body || {};
    const user = await updateUser(req.params.id, { fullName, role, isActive, reviewerCapacity });
    return res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    await deleteUser(req.params.id);
    return res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/reset-password', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { newPassword } = req.body || {};

    if (!newPassword) {
      return res.status(400).json({ message: 'La nueva contraseña es obligatoria' });
    }

    const user = await resetPassword(req.params.id, newPassword);
    return res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
