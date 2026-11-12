import { supabase } from '../config/supabase.js';
import { notifyDocumentStatusChange } from './notifications.js';

export async function listDocuments({ userId, role, status, search }) {
  let query = supabase
    .from('documents')
    .select(`
      id,
      student_id,
      reviewer_id,
      title,
      document_type,
      status,
      submitted_at,
      approved_at,
      assigned_at,
      reviewed_at,
      version,
      student:students(
        id,
        student_code,
        career,
        semester,
        university:universities(name, short_name),
        profile:profiles(id, full_name, email)
      ),
      reviewer:profiles!documents_reviewer_id_fkey(full_name, email),
      academic_period:academic_periods(name)
    `)
    .order('submitted_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,document_type.ilike.%${search}%`);
  }

  if (role === 'student') {
    const { data: student, error } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', userId)
      .single();

    if (error || !student) {
      return [];
    }

    query = query.eq('student_id', student.id);
  } else if (role === 'reviewer') {
    query = query.eq('reviewer_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getDocumentById(documentId, userId, role) {
  const { data: document, error } = await supabase
    .from('documents')
    .select(`
      id,
      student_id,
      reviewer_id,
      title,
      document_type,
      status,
      storage_path,
      submitted_at,
      approved_at,
      assigned_at,
      reviewed_at,
      version,
      student:students(
        id,
        student_code,
        career,
        semester,
        university:universities(name, short_name),
        profile:profiles(id, full_name, email)
      ),
      reviewer:profiles!documents_reviewer_id_fkey(full_name, email),
      academic_period:academic_periods(name),
      assignments:document_assignments(
        id,
        status,
        notes,
        assigned_at,
        completed_at,
        decision,
        reviewer:profiles(full_name, email)
      ),
      observations(
        id,
        observation,
        severity,
        status,
        created_at,
        resolved_at,
        reviewer:profiles(full_name)
      ),
      versions:document_versions(
        id,
        version_number,
        storage_path,
        created_at,
        uploaded_by
      )
    `)
    .eq('id', documentId)
    .single();

  if (error || !document) {
    const err = new Error('Documento no encontrado');
    err.status = 404;
    throw err;
  }

  const isOwner = document.student?.profile?.id === userId;
  const isReviewer = document.reviewer_id === userId || document.assignments?.some((a) => a.reviewer_id === userId);
  const isStaff = ['admin', 'coordinator'].includes(role);

  if (!isOwner && !isReviewer && !isStaff) {
    const err = new Error('No tienes permiso para ver este documento');
    err.status = 403;
    throw err;
  }

  return document;
}

export async function createDocument({ studentId, academicPeriodId, title, documentType, storagePath }) {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      student_id: studentId,
      academic_period_id: academicPeriodId,
      title,
      document_type: documentType,
      storage_path: storagePath,
      status: 'submitted'
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateDocumentStatus(documentId, status, extra = {}) {
  const { data: currentDoc, error: currentError } = await supabase
    .from('documents')
    .select(`
      id,
      title,
      status,
      student:students(
        profile_id
      ),
      reviewer_id
    `)
    .eq('id', documentId)
    .single();

  if (currentError) {
    throw currentError;
  }

  const updates = {
    status,
    updated_at: new Date().toISOString(),
    ...extra
  };

  if (status === 'approved') {
    updates.approved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', documentId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (currentDoc && currentDoc.status !== status) {
    const documentWithDetails = {
      ...currentDoc,
      student: {
        profile_id: currentDoc.student?.profile_id
      }
    };

    try {
      const { data: actorProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', extra.actorId)
        .single();

      await notifyDocumentStatusChange(
        documentWithDetails,
        currentDoc.status,
        status,
        extra.actorId || null,
        actorProfile?.role || null
      );
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
    }
  }

  return data;
}

export async function submitCorrection(documentId, userId, { storagePath, notes }) {
  const { data: document, error: documentError } = await supabase
    .from('documents')
    .select('id, status, version, student_id')
    .eq('id', documentId)
    .single();

  if (documentError || !document) {
    const err = new Error('Documento no encontrado');
    err.status = 404;
    throw err;
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, profile_id')
    .eq('id', document.student_id)
    .single();

  if (studentError || !student || student.profile_id !== userId) {
    const err = new Error('Solo el estudiante propietario puede corregir este documento');
    err.status = 403;
    throw err;
  }

  if (document.status !== 'observed') {
    const err = new Error('El documento no está en estado de observación');
    err.status = 409;
    throw err;
  }

  const nextVersion = document.version + 1;

  const { error: versionError } = await supabase
    .from('document_versions')
    .insert({
      document_id: documentId,
      version_number: nextVersion,
      storage_path: storagePath,
      uploaded_by: userId
    });

  if (versionError) {
    throw versionError;
  }

  const updatedDocument = await updateDocumentStatus(documentId, 'corrected', {
    storage_path: storagePath,
    version: nextVersion,
    submitted_at: new Date().toISOString(),
    actorId: userId
  });

  await supabase
    .from('document_assignments')
    .update({ status: 'pending' })
    .eq('document_id', documentId)
    .eq('status', 'observed');

  return updatedDocument;
}
