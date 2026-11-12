import { supabase } from '../config/supabase.js';

export async function listUniversities({ isActive, search }) {
  let query = supabase
    .from('universities')
    .select('*')
    .order('name', { ascending: true });

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,short_name.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getUniversityById(universityId) {
  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .eq('id', universityId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createUniversity({ name, shortName }) {
  const { data, error } = await supabase
    .from('universities')
    .insert({
      name,
      short_name: shortName,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateUniversity(universityId, { name, shortName, isActive }) {
  const updates = {};

  if (name !== undefined) updates.name = name;
  if (shortName !== undefined) updates.short_name = shortName;
  if (isActive !== undefined) updates.is_active = isActive;

  const { data, error } = await supabase
    .from('universities')
    .update(updates)
    .eq('id', universityId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteUniversity(universityId) {
  const { error } = await supabase
    .from('universities')
    .delete()
    .eq('id', universityId);

  if (error) {
    throw error;
  }

  return true;
}
