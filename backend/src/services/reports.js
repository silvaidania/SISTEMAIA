import { supabase } from '../config/supabase.js';

export async function getSystemMetrics() {
  const [
    { count: totalDocuments },
    { count: submittedDocuments },
    { count: inReviewDocuments },
    { count: observedDocuments },
    { count: correctedDocuments },
    { count: approvedDocuments },
    { count: rejectedDocuments },
    { count: totalStudents },
    { count: totalReviewers },
    { count: totalObservations }
  ] = await Promise.all([
    supabase.from('documents').select('*', { count: 'exact', head: true }),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'in_review'),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'observed'),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'corrected'),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'reviewer'),
    supabase.from('observations').select('*', { count: 'exact', head: true })
  ]);

  return {
    documents: {
      total: totalDocuments || 0,
      submitted: submittedDocuments || 0,
      in_review: inReviewDocuments || 0,
      observed: observedDocuments || 0,
      corrected: correctedDocuments || 0,
      approved: approvedDocuments || 0,
      rejected: rejectedDocuments || 0
    },
    users: {
      students: totalStudents || 0,
      reviewers: totalReviewers || 0
    },
    observations: totalObservations || 0
  };
}

export async function getDocumentsByStatus() {
  const { data, error } = await supabase
    .from('documents')
    .select('status')
    .order('status');

  if (error) {
    throw error;
  }

  const counts = {};
  data.forEach((doc) => {
    counts[doc.status] = (counts[doc.status] || 0) + 1;
  });

  return counts;
}

export async function getDocumentsByUniversity() {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      id,
      student:students(
        university:universities(name, short_name)
      )
    `);

  if (error) {
    throw error;
  }

  const counts = {};
  data.forEach((doc) => {
    const universityName = doc.student?.university?.short_name || doc.student?.university?.name || 'Sin universidad';
    counts[universityName] = (counts[universityName] || 0) + 1;
  });

  return counts;
}

export async function getDocumentsByPeriod() {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      id,
      academic_period:academic_periods(name)
    `);

  if (error) {
    throw error;
  }

  const counts = {};
  data.forEach((doc) => {
    const periodName = doc.academic_period?.name || 'Sin periodo';
    counts[periodName] = (counts[periodName] || 0) + 1;
  });

  return counts;
}

export async function getReviewerPerformance() {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      reviewer_capacity,
      current_workload,
      assignments:document_assignments(
        id,
        status,
        decision,
        assigned_at,
        completed_at
      )
    `)
    .eq('role', 'reviewer')
    .eq('is_active', true);

  if (error) {
    throw error;
  }

  return data.map((reviewer) => {
    const assignments = reviewer.assignments || [];
    const completed = assignments.filter((a) => a.status === 'approved' || a.status === 'rejected');
    const approved = assignments.filter((a) => a.decision === 'approve');
    const rejected = assignments.filter((a) => a.decision === 'reject');
    const pending = assignments.filter((a) => a.status === 'pending' || a.status === 'in_review' || a.status === 'observed');

    const avgReviewTime = completed.length > 0
      ? completed.reduce((sum, a) => {
          if (a.assigned_at && a.completed_at) {
            const start = new Date(a.assigned_at);
            const end = new Date(a.completed_at);
            return sum + (end - start);
          }
          return sum;
        }, 0) / completed.length / (1000 * 60 * 60 * 24) // days
      : 0;

    return {
      id: reviewer.id,
      full_name: reviewer.full_name,
      capacity: reviewer.reviewer_capacity,
      current_workload: reviewer.current_workload,
      total_assigned: assignments.length,
      completed: completed.length,
      approved: approved.length,
      rejected: rejected.length,
      pending: pending.length,
      approval_rate: completed.length > 0 ? (approved.length / completed.length) * 100 : 0,
      avg_review_time_days: Math.round(avgReviewTime * 10) / 10
    };
  });
}

export async function getStudentProgress() {
  const { data, error } = await supabase
    .from('students')
    .select(`
      id,
      student_code,
      career,
      semester,
      university:universities(name, short_name),
      profile:profiles(full_name, email),
      documents(
        id,
        status,
        submitted_at,
        approved_at
      )
    `);

  if (error) {
    throw error;
  }

  return data.map((student) => {
    const documents = student.documents || [];
    const total = documents.length;
    const approved = documents.filter((d) => d.status === 'approved').length;
    const inProgress = documents.filter((d) => !['approved', 'rejected'].includes(d.status)).length;
    const observed = documents.filter((d) => d.status === 'observed').length;

    return {
      id: student.id,
      student_code: student.student_code,
      full_name: student.profile?.full_name,
      email: student.profile?.email,
      career: student.career,
      semester: student.semester,
      university: student.university?.short_name || student.university?.name,
      total_documents: total,
      approved_documents: approved,
      in_progress_documents: inProgress,
      observed_documents: observed,
      completion_rate: total > 0 ? (approved / total) * 100 : 0
    };
  });
}

export async function getObservationsSummary() {
  const { data, error } = await supabase
    .from('observations')
    .select(`
      id,
      severity,
      status,
      created_at,
      document:documents(
        id,
        status,
        student:students(
          profile:profiles(full_name)
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const bySeverity = {};
  const byStatus = {};
  const recent = [];

  data.forEach((obs) => {
    bySeverity[obs.severity] = (bySeverity[obs.severity] || 0) + 1;
    byStatus[obs.status] = (byStatus[obs.status] || 0) + 1;

    if (recent.length < 10) {
      recent.push({
        id: obs.id,
        severity: obs.severity,
        status: obs.status,
        created_at: obs.created_at,
        document_status: obs.document?.status,
        student_name: obs.document?.student?.profile?.full_name
      });
    }
  });

  return {
    by_severity: bySeverity,
    by_status: byStatus,
    recent
  };
}

export async function getAcademicReport(periodId = null) {
  let query = supabase
    .from('documents')
    .select(`
      id,
      title,
      document_type,
      status,
      submitted_at,
      approved_at,
      academic_period:academic_periods(id, name),
      student:students(
        student_code,
        career,
        semester,
        university:universities(name, short_name),
        profile:profiles(full_name)
      ),
      reviewer:profiles!documents_reviewer_id_fkey(full_name)
    `)
    .order('submitted_at', { ascending: false });

  if (periodId) {
    query = query.eq('academic_period_id', periodId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data.map((doc) => ({
    id: doc.id,
    title: doc.title,
    document_type: doc.document_type,
    status: doc.status,
    submitted_at: doc.submitted_at,
    approved_at: doc.approved_at,
    period: doc.academic_period?.name,
    student_code: doc.student?.student_code,
    student_name: doc.student?.profile?.full_name,
    career: doc.student?.career,
    semester: doc.student?.semester,
    university: doc.student?.university?.short_name || doc.student?.university?.name,
    reviewer: doc.reviewer?.full_name
  }));
}
