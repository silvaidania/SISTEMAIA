import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getSystemMetrics,
  getDocumentsByStatus,
  getDocumentsByUniversity,
  getDocumentsByPeriod,
  getReviewerPerformance,
  getStudentProgress,
  getObservationsSummary,
  getAcademicReport
} from '../services/reports.js';
import {
  generateAcademicReportPDF,
  generateReviewerReportPDF,
  generateStudentReportPDF
} from '../services/exportPDF.js';
import {
  generateAcademicReportExcel,
  generateReviewerReportExcel,
  generateStudentReportExcel
} from '../services/exportExcel.js';

const router = Router();

router.get('/metrics', requireAuth, requireRole('admin', 'coordinator'), async (_req, res, next) => {
  try {
    const metrics = await getSystemMetrics();
    return res.json({ metrics });
  } catch (error) {
    next(error);
  }
});

router.get('/documents-by-status', requireAuth, requireRole('admin', 'coordinator'), async (_req, res, next) => {
  try {
    const data = await getDocumentsByStatus();
    return res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/documents-by-university', requireAuth, requireRole('admin', 'coordinator'), async (_req, res, next) => {
  try {
    const data = await getDocumentsByUniversity();
    return res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/documents-by-period', requireAuth, requireRole('admin', 'coordinator'), async (_req, res, next) => {
  try {
    const data = await getDocumentsByPeriod();
    return res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/reviewer-performance', requireAuth, requireRole('admin', 'coordinator'), async (_req, res, next) => {
  try {
    const data = await getReviewerPerformance();
    return res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/student-progress', requireAuth, requireRole('admin', 'coordinator'), async (_req, res, next) => {
  try {
    const data = await getStudentProgress();
    return res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/observations-summary', requireAuth, requireRole('admin', 'coordinator', 'reviewer'), async (_req, res, next) => {
  try {
    const data = await getObservationsSummary();
    return res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/academic', requireAuth, requireRole('admin', 'coordinator'), async (req, res, next) => {
  try {
    const { periodId } = req.query;
    const data = await getAcademicReport(periodId);
    return res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/export/academic/pdf', requireAuth, requireRole('admin', 'coordinator'), async (req, res, next) => {
  try {
    const { periodId } = req.query;
    const pdfBuffer = await generateAcademicReportPDF(periodId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-academico.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

router.get('/export/academic/excel', requireAuth, requireRole('admin', 'coordinator'), async (req, res, next) => {
  try {
    const { periodId } = req.query;
    const excelBuffer = await generateAcademicReportExcel(periodId);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-academico.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
});

router.get('/export/reviewers/pdf', requireAuth, requireRole('admin', 'coordinator'), async (_req, res, next) => {
  try {
    const pdfBuffer = await generateReviewerReportPDF();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-revisores.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

router.get('/export/reviewers/excel', requireAuth, requireRole('admin', 'coordinator'), async (_req, res, next) => {
  try {
    const excelBuffer = await generateReviewerReportExcel();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-revisores.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
});

router.get('/export/students/pdf', requireAuth, requireRole('admin', 'coordinator'), async (_req, res, next) => {
  try {
    const pdfBuffer = await generateStudentReportPDF();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-estudiantes.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

router.get('/export/students/excel', requireAuth, requireRole('admin', 'coordinator'), async (_req, res, next) => {
  try {
    const excelBuffer = await generateStudentReportExcel();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-estudiantes.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
});

export default router;
