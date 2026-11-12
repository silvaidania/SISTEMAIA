import { supabase } from '../config/supabase.js';

export async function listAcademicPeriods({ universityId, isActive, search }) {
  let query = supabase
    .from('academic_periods')
    .select(`
      id,
      name,
      start_date,
      end_date,
      is_active,
      created_at,
      university:universities(
        id,
        name,
        short_name
      )
    `)
    .order('start_date', { ascending: false });

  if (universityId) {
    query = query.eq('university_id', universityId);
  }

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive);
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getAcademicPeriodById(periodId) {
  const { data, error } = await supabase
    .from('academic_periods')
    .select(`
      id,
      name,
      start_date,
      end_date,
      is_active,
      created_at,
      university:universities(
        id,
        name,
        short_name
      )
    `)
    .eq('id', periodId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createAcademicPeriod({ universityId, name, startDate, endDate }) {
  const { data, error } = await supabase
    .from('academic_periods')
    .insert({
      university_id: universityId,
      name,
      start_date: startDate,
      end_date: endDate,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateAcademicPeriod(periodId, { universityId, name, startDate, endDate, isActive }) {
  const updates = {};

  if (universityId !== undefined) updates.university_id = universityId;
  if (name !== undefined) updates.name = name;
  if (startDate !== undefined) updates.start_date = startDate;
  if (endDate !== undefined) updates.end_date = endDate;
  if (isActive !== undefined) updates.is_active = isActive;

  const { data, error } = await supabase
    .from('academic_periods')
    .update(updates)
    .eq('id', periodId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteAcademicPeriod(periodId) {
  const { error } = await supabase
    .from('academic_periods')
    .delete()
    .eq('id', periodId);

  if (error) {
    throw error;
  }

  return true;
}
