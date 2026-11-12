import { supabase } from '../config/supabase.js';
import { updateDocumentStatus } from './documents.js';

export async function addObservation({ documentId, reviewerId, observation, severity = 'medium' }) {
  const { data: document, error: documentError } = await supabase
    .from('documents')
    .select('id, status, reviewer_id')
    .eq('id', documentId)
    .single();

  if (documentError || !document) {
    const err = new Error('Documento no encontrado');
    err.status = 404;
    throw err;
  }

  if (document.reviewer_id !== reviewerId) {
    const err = new Error('Solo el revisor asignado puede observar este documento');
    err.status = 403;
    throw err;
  }

  if (!['in_review', 'observed'].includes(document.status)) {
    const err = new Error('El documento no admite observaciones en su estado actual');
    err.status = 409;
    throw err;
  }

  const { data, error } = await supabase
    .from('observations')
    .insert({
      document_id: documentId,
      reviewer_id: reviewerId,
      observation,
      severity,
      status: 'open'
    })
    .select('id, document_id, observation, severity, status, created_at')
    .single();

  if (error) {
    throw error;
  }

  await updateDocumentStatus(documentId, 'observed');

  await supabase
    .from('document_assignments')
    .update({ status: 'observed' })
    .eq('document_id', documentId)
    .eq('reviewer_id', reviewerId)
    .eq('status', 'in_review');

  return data;
}

export async function resolveObservation(observationId, userId, role) {
  const { data: observation, error: observationError } = await supabase
    .from('observations')
    .select('id, document_id, reviewer_id, status')
    .eq('id', observationId)
    .single();

  if (observationError || !observation) {
    const err = new Error('Observación no encontrada');
    err.status = 404;
    throw err;
  }

  const isStaff = ['admin', 'coordinator'].includes(role);
  const isReviewer = observation.reviewer_id === userId;

  if (!isStaff && !isReviewer) {
    const err = new Error('No tienes permiso para resolver esta observación');
    err.status = 403;
    throw err;
  }

  const { data, error } = await supabase
    .from('observations')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString()
    })
    .eq('id', observationId)
    .select('id, document_id, status, resolved_at')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function decideDocument(documentId, reviewerId, decision, notes = '') {
  const { data: document, error: documentError } = await supabase
    .from('documents')
    .select('id, status, reviewer_id')
    .eq('id', documentId)
    .single();

  if (documentError || !document) {
    const err = new Error('Documento no encontrado');
    err.status = 404;
    throw err;
  }

  if (document.reviewer_id !== reviewerId) {
    const err = new Error('Solo el revisor asignado puede decidir este documento');
    err.status = 403;
    throw err;
  }

  if (!['in_review', 'observed', 'corrected'].includes(document.status)) {
    const err = new Error('El documento no admite decisión en su estado actual');
    err.status = 409;
    throw err;
  }

  const nextStatus = decision === 'approve' ? 'approved' : 'rejected';

  const updatedDocument = await updateDocumentStatus(documentId, nextStatus, {
    reviewed_at: new Date().toISOString(),
    reviewer_id: reviewerId
  });

  await supabase
    .from('document_assignments')
    .update({
      status: decision === 'approve' ? 'approved' : 'rejected',
      decision,
      notes,
      completed_at: new Date().toISOString()
    })
    .eq('document_id', documentId)
    .eq('reviewer_id', reviewerId)
    .eq('status', 'in_review');

  await supabase.rpc('sync_reviewer_workload', { target_reviewer_id: reviewerId });

  return updatedDocument;
}
