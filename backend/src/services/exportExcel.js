import ExcelJS from 'exceljs';
import { getAcademicReport, getSystemMetrics, getReviewerPerformance, getStudentProgress } from './reports.js';

export async function generateAcademicReportExcel(periodId = null) {
  const reportData = await getAcademicReport(periodId);
  const metrics = await getSystemMetrics();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema IA';
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet('Resumen');
  summarySheet.columns = [
    { header: 'Métrica', key: 'metric', width: 30 },
    { header: 'Valor', key: 'value', width: 20 }
  ];

  summarySheet.addRow({ metric: 'Total de documentos', value: metrics.documents.total });
  summarySheet.addRow({ metric: 'Documentos aprobados', value: metrics.documents.approved });
  summarySheet.addRow({ metric: 'Documentos en revisión', value: metrics.documents.in_review });
  summarySheet.addRow({ metric: 'Documentos con observaciones', value: metrics.documents.observed });
  summarySheet.addRow({ metric: 'Total de estudiantes', value: metrics.users.students });
  summarySheet.addRow({ metric: 'Total de revisores', value: metrics.users.reviewers });

  const detailSheet = workbook.addWorksheet('Detalle de Documentos');
  detailSheet.columns = [
    { header: 'Título', key: 'title', width: 30 },
    { header: 'Estudiante', key: 'student', width: 25 },
    { header: 'Código', key: 'code', width: 15 },
    { header: 'Carrera', key: 'career', width: 20 },
    { header: 'Semestre', key: 'semester', width: 12 },
    { header: 'Universidad', key: 'university', width: 25 },
    { header: 'Periodo', key: 'period', width: 15 },
    { header: 'Estado', key: 'status', width: 15 },
    { header: 'Revisor', key: 'reviewer', width: 25 },
    { header: 'Fecha envío', key: 'submitted', width: 15 },
    { header: 'Fecha aprobación', key: 'approved', width: 15 }
  ];

  reportData.forEach(doc => {
    detailSheet.addRow({
      title: doc.title,
      student: doc.student_name,
      code: doc.student_code,
      career: doc.career,
      semester: doc.semester,
      university: doc.university,
      period: doc.period,
      status: doc.status,
      reviewer: doc.reviewer || 'Sin asignar',
      submitted: new Date(doc.submitted_at).toLocaleDateString(),
      approved: doc.approved_at ? new Date(doc.approved_at).toLocaleDateString() : ''
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export async function generateReviewerReportExcel() {
  const reviewerData = await getReviewerPerformance();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema IA';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Rendimiento de Revisores');
  sheet.columns = [
    { header: 'Revisor', key: 'name', width: 25 },
    { header: 'Capacidad', key: 'capacity', width: 12 },
    { header: 'Carga actual', key: 'workload', width: 12 },
    { header: 'Total asignados', key: 'total', width: 15 },
    { header: 'Completados', key: 'completed', width: 12 },
    { header: 'Aprobados', key: 'approved', width: 12 },
    { header: 'Rechazados', key: 'rejected', width: 12 },
    { header: 'Pendientes', key: 'pending', width: 12 },
    { header: 'Tasa aprobación (%)', key: 'approvalRate', width: 18 },
    { header: 'Tiempo prom. revisión (días)', key: 'avgTime', width: 25 }
  ];

  reviewerData.forEach(reviewer => {
    sheet.addRow({
      name: reviewer.full_name,
      capacity: reviewer.capacity,
      workload: reviewer.current_workload,
      total: reviewer.total_assigned,
      completed: reviewer.completed,
      approved: reviewer.approved,
      rejected: reviewer.rejected,
      pending: reviewer.pending,
      approvalRate: reviewer.approval_rate.toFixed(1),
      avgTime: reviewer.avg_review_time_days
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export async function generateStudentReportExcel() {
  const studentData = await getStudentProgress();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema IA';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Progreso de Estudiantes');
  sheet.columns = [
    { header: 'Estudiante', key: 'name', width: 25 },
    { header: 'Código', key: 'code', width: 15 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Carrera', key: 'career', width: 20 },
    { header: 'Semestre', key: 'semester', width: 12 },
    { header: 'Universidad', key: 'university', width: 25 },
    { header: 'Total documentos', key: 'total', width: 15 },
    { header: 'Aprobados', key: 'approved', width: 12 },
    { header: 'En progreso', key: 'inProgress', width: 12 },
    { header: 'Con observaciones', key: 'observed', width: 18 },
    { header: 'Tasa completado (%)', key: 'completionRate', width: 20 }
  ];

  studentData.forEach(student => {
    sheet.addRow({
      name: student.full_name,
      code: student.student_code,
      email: student.email,
      career: student.career,
      semester: student.semester,
      university: student.university,
      total: student.total_documents,
      approved: student.approved_documents,
      inProgress: student.in_progress_documents,
      observed: student.observed_documents,
      completionRate: student.completion_rate.toFixed(1)
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
