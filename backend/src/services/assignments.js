import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { updateDocumentStatus } from './documents.js';

export async function assignDocumentToReviewer(documentId, reviewerId, assignedBy) {
  const { data: document, error: documentError } = await supabase
    .from('documents')
    .select('id, status, student_id')
    .eq('id', documentId)
    .single();

  if (documentError || !document) {
    const err = new Error('Documento no encontrado');
    err.status = 404;
    throw err;
  }

  if (document.status !== 'submitted' && document.status !== 'corrected') {
    const err = new Error('El documento no está pendiente de asignación');
    err.status = 409;
    throw err;
  }

  const { data: reviewer, error: reviewerError } = await supabase
    .from('profiles')
    .select('id, reviewer_capacity, current_workload')
    .eq('id', reviewerId)
    .eq('role', 'reviewer')
    .eq('is_active', true)
    .single();

  if (reviewerError || !reviewer) {
    const err = new Error('Revisor no válido o inactivo');
    err.status = 400;
    throw err;
  }

  const capacity = reviewer.reviewer_capacity || env.defaultReviewerCapacity;
  if (reviewer.current_workload >= capacity) {
    const err = new Error('El revisor alcanzó su capacidad máxima');
    err.status = 409;
    throw err;
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from('document_assignments')
    .insert({
      document_id: documentId,
      reviewer_id: reviewerId,
      assigned_by: assignedBy,
      status: 'pending'
    })
    .select('id, document_id, reviewer_id, status, assigned_at')
    .single();

  if (assignmentError) {
    throw assignmentError;
  }

  await updateDocumentStatus(documentId, 'in_review', {
    reviewer_id: reviewerId,
    assigned_at: new Date().toISOString()
  });

  await supabase
    .from('profiles')
    .update({ current_workload: reviewer.current_workload + 1 })
    .eq('id', reviewerId);

  return assignment;
}

export async function assignDocumentWithBalance(documentId, assignedBy) {
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
    const err = new Error('No hay revisores disponibles con capacidad');
    err.status = 409;
    throw err;
  }

  return assignDocumentToReviewer(documentId, reviewer.id, assignedBy);
}
