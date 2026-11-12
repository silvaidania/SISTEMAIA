import PDFDocument from 'pdfkit';
import { getAcademicReport, getSystemMetrics, getReviewerPerformance, getStudentProgress } from './reports.js';

export async function generateAcademicReportPDF(periodId = null) {
  const reportData = await getAcademicReport(periodId);
  const metrics = await getSystemMetrics();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('Reporte Académico - Sistema IA', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Fecha de generación: ${new Date().toLocaleDateString('es-MX')}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(16).text('Resumen del Sistema', { underline: true });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Total de documentos: ${metrics.documents.total}`);
    doc.text(`Documentos aprobados: ${metrics.documents.approved}`);
    doc.text(`Documentos en revisión: ${metrics.documents.in_review}`);
    doc.text(`Documentos con observaciones: ${metrics.documents.observed}`);
    doc.text(`Total de estudiantes: ${metrics.users.students}`);
    doc.text(`Total de revisores: ${metrics.users.reviewers}`);
    doc.moveDown(2);

    doc.fontSize(16).text('Detalle de Documentos', { underline: true });
    doc.moveDown();

    reportData.forEach((doc_item, index) => {
      doc.fontSize(14).text(`${index + 1}. ${doc_item.title}`);
      doc.fontSize(10);
      doc.text(`   Estudiante: ${doc_item.student_name} (${doc_item.student_code})`);
      doc.text(`   Carrera: ${doc_item.career} - Semestre: ${doc_item.semester}`);
      doc.text(`   Universidad: ${doc_item.university}`);
      doc.text(`   Periodo: ${doc_item.period}`);
      doc.text(`   Estado: ${doc_item.status}`);
      doc.text(`   Revisor: ${doc_item.reviewer || 'Sin asignar'}`);
      doc.text(`   Fecha envío: ${new Date(doc_item.submitted_at).toLocaleDateString()}`);
      if (doc_item.approved_at) {
        doc.text(`   Fecha aprobación: ${new Date(doc_item.approved_at).toLocaleDateString()}`);
      }
      doc.moveDown();

      if (index < reportData.length - 1) {
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
      }
    });

    doc.end();
  });
}

export async function generateReviewerReportPDF() {
  const reviewerData = await getReviewerPerformance();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('Reporte de Rendimiento de Revisores', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Fecha de generación: ${new Date().toLocaleDateString('es-MX')}`, { align: 'center' });
    doc.moveDown(2);

    reviewerData.forEach((reviewer, index) => {
      doc.fontSize(16).text(`${index + 1}. ${reviewer.full_name}`);
      doc.fontSize(11);
      doc.text(`   Capacidad: ${reviewer.capacity} documentos`);
      doc.text(`   Carga actual: ${reviewer.current_workload} documentos`);
      doc.text(`   Total asignados: ${reviewer.total_assigned}`);
      doc.text(`   Completados: ${reviewer.completed}`);
      doc.text(`   Aprobados: ${reviewer.approved}`);
      doc.text(`   Rechazados: ${reviewer.rejected}`);
      doc.text(`   Pendientes: ${reviewer.pending}`);
      doc.text(`   Tasa de aprobación: ${reviewer.approval_rate.toFixed(1)}%`);
      doc.text(`   Tiempo promedio de revisión: ${reviewer.avg_review_time_days} días`);
      doc.moveDown();

      if (index < reviewerData.length - 1) {
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
      }
    });

    doc.end();
  });
}

export async function generateStudentReportPDF() {
  const studentData = await getStudentProgress();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('Reporte de Progreso de Estudiantes', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Fecha de generación: ${new Date().toLocaleDateString('es-MX')}`, { align: 'center' });
    doc.moveDown(2);

    studentData.forEach((student, index) => {
      doc.fontSize(16).text(`${index + 1}. ${student.full_name}`);
      doc.fontSize(11);
      doc.text(`   Código: ${student.student_code}`);
      doc.text(`   Email: ${student.email}`);
      doc.text(`   Carrera: ${student.career}`);
      doc.text(`   Semestre: ${student.semester}`);
      doc.text(`   Universidad: ${student.university}`);
      doc.text(`   Total documentos: ${student.total_documents}`);
      doc.text(`   Aprobados: ${student.approved_documents}`);
      doc.text(`   En progreso: ${student.in_progress_documents}`);
      doc.text(`   Con observaciones: ${student.observed_documents}`);
      doc.text(`   Tasa de completado: ${student.completion_rate.toFixed(1)}%`);
      doc.moveDown();

      if (index < studentData.length - 1) {
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
      }
    });

    doc.end();
  });
}
