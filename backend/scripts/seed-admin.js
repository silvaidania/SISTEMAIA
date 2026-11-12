import bcrypt from 'bcryptjs';
import { hashPassword } from '../src/utils/security.js';
import { supabase } from '../src/config/supabase.js';

const email = process.env.SEED_ADMIN_EMAIL || 'admin@universidad.edu';
const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
const fullName = process.env.SEED_ADMIN_NAME || 'Administrador';

const passwordHash = await hashPassword(password);

const { data: existing } = await supabase
  .from('profiles')
  .select('id')
  .eq('email', email)
  .maybeSingle();

if (existing) {
  await supabase
    .from('profiles')
    .update({
      password_hash: passwordHash,
      full_name: fullName,
      role: 'admin',
      is_active: true
    })
    .eq('id', existing.id);

  console.log('Usuario admin actualizado');
} else {
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) {
    throw error;
  }

  const { data: authData } = await supabase.auth.admin.listUsers();
  const authUser = authData.users.find((u) => u.email === email);

  if (!authUser) {
    throw new Error('No se pudo recuperar el usuario creado');
  }

  await supabase.from('profiles').insert({
    id: authUser.id,
    email,
    full_name: fullName,
    role: 'admin',
    password_hash: passwordHash,
    is_active: true
  });

  console.log('Usuario admin creado');
}
