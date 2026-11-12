import { supabase } from '../config/supabase.js';

export async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, is_active, password_hash')
    .eq('email', email)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function updateLastLogin(userId) {
  await supabase
    .from('profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId);
}
