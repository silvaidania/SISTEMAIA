import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Obtener perfil del usuario actual
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.userId)
      .single();

    if (error) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }

    res.json({ profile: data });
  } catch (error) {
    next(error);
  }
});

// Actualizar perfil del usuario actual
router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const { full_name } = req.body;

    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name })
      .eq('id', req.user.userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ profile: data });
  } catch (error) {
    next(error);
  }
});

// Crear perfil para nuevo usuario (usado después del registro con Supabase Auth)
router.post('/profile', requireAuth, async (req, res, next) => {
  try {
    const { full_name, role = 'student' } = req.body;

    // Verificar si el perfil ya existe
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', req.user.userId)
      .single();

    if (existing) {
      return res.status(400).json({ message: 'El perfil ya existe' });
    }

    // Crear el perfil
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: req.user.userId,
        email: req.user.email,
        full_name,
        role
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json({ profile: data });
  } catch (error) {
    next(error);
  }
});

export default router;
