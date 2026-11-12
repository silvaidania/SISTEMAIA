import { supabase } from '../config/supabase.js';
import { assignDocumentWithBalance } from './assignments.js';

export async function getReviewerBalance() {
  const { data, error } = await supabase
    .from('v_reviewer_load_balance')
    .select('*')
    .order('pending_documents', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getAssignableReviewers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, reviewer_capacity, current_workload')
    .eq('role', 'reviewer')
    .eq('is_active', true)
    .order('current_workload', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function assignReviewerWithBalance(documentId, assignedBy) {
  return assignDocumentWithBalance(documentId, assignedBy);
}
