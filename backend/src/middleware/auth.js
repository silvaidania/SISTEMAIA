import { verifyToken } from '../utils/security.js';
import { supabase } from '../config/supabase.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  try {
    // Intentar verificar con JWT propio primero (compatibilidad)
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      return next();
    } catch {
      // Si falla, intentar con Supabase Auth
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
      }

      // Obtener el perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        return res.status(401).json({ message: 'Perfil de usuario no encontrado' });
      }

      req.user = {
        userId: user.id,
        email: user.email,
        role: profile.role
      };
      next();
    }
  } catch (error) {
    return res.status(401).json({ message: 'Error de autenticación' });
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
