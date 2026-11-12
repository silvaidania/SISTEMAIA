import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';

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
  const { data: reviewers, error: reviewersError } = await supabase
    .from('profiles')
    .select('id, reviewer_capacity, current_workload')
    .eq('role', 'reviewer')
    .eq('is_active', true)
    .order('current_workload', { ascending: true });

  if (reviewersError) {
    throw reviewersError;
  }

  const reviewer = reviewers.find((r) => r.current_workload < (r.reviewer_capacity || env.defaultReviewerCapacity));

  if (!reviewer) {
    const error = new Error('No hay revisores disponibles con capacidad');
    error.status = 409;
    throw error;
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from('document_assignments')
    .insert({
      document_id: documentId,
      reviewer_id: reviewer.id,
      assigned_by: assignedBy,
      status: 'pending'
    })
    .select('id, reviewer_id, document_id')
    .single();

  if (assignmentError) {
    throw assignmentError;
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ current_workload: reviewer.current_workload + 1 })
    .eq('id', reviewer.id);

  if (updateError) {
    throw updateError;
  }

  return assignment;
}
