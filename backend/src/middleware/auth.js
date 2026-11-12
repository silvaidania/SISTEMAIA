import { verifyToken } from '../utils/security.js';
import { supabase } from '../config/supabase.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

export function requireRole(...roles) {
  return async (req, res, next) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', req.user.userId)
      .single();

    if (error || !data || !data.is_active) {
      return res.status(403).json({ message: 'Acceso no autorizado' });
    }

    if (!roles.includes(data.role)) {
      return res.status(403).json({ message: 'Permisos insuficientes' });
    }

    req.user.role = data.role;
    next();
  };
}
