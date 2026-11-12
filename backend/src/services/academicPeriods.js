import { supabase } from '../config/supabase.js';

export async function listAcademicPeriods() {
  const { data, error } = await supabase
    .from('academic_periods')
    .select('id, name, start_date, end_date, university:universities(name, short_name)')
    .eq('is_active', true)
    .order('start_date', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}
