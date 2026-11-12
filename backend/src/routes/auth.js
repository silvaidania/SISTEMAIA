import { Router } from 'express';
import { findUserByEmail, updateLastLogin } from '../services/auth.js';
import { verifyPassword, signToken } from '../utils/security.js';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son obligatorios' });
  }

  const user = await findUserByEmail(email);

  if (!user || !user.is_active) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const valid = await verifyPassword(password, user.password_hash);

  if (!valid) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  await updateLastLogin(user.id);

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    }
  });
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, is_active')
      .eq('id', req.user.userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.json({ user: data });
  } catch (error) {
    next(error);
  }
});

export default router;
