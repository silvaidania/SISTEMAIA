import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listDocuments, getDocumentById, createDocument, submitCorrection } from '../services/documents.js';
import { assignDocumentToReviewer, assignDocumentWithBalance } from '../services/assignments.js';
import { addObservation, resolveObservation, decideDocument } from '../services/observations.js';
import { uploadDocumentFile, getSignedUrl, getFileType, getFileName } from '../services/storage.js';
import { supabase } from '../config/supabase.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const documents = await listDocuments({
      userId: req.user.userId,
      role: req.user.role,
      status,
      search
    });
    return res.json({ documents });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const { academicPeriodId, title, documentType, storagePath } = req.body || {};

    if (!academicPeriodId || !title || !documentType) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', req.user.userId)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ message: 'No se encontró perfil de estudiante' });
    }

    const document = await createDocument({
      studentId: student.id,
      academicPeriodId,
      title,
      documentType,
      storagePath
    });

    try {
      await assignDocumentWithBalance(document.id, req.user.userId);
    } catch (assignError) {
      console.error('No se pudo asignar revisor automáticamente:', assignError.message);
    }

    return res.status(201).json({ document });
  } catch (error) {
    next(error);
  }
});

router.post('/upload', requireAuth, requireRole('student'), upload.single('file'), async (req, res, next) => {
  try {
    const { academicPeriodId, title, documentType } = req.body || {};

    if (!req.file) {
      return res.status(400).json({ message: 'El archivo es obligatorio' });
    }

    if (!academicPeriodId || !title || !documentType) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', req.user.userId)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ message: 'No se encontró perfil de estudiante' });
    }

    const storagePath = await uploadDocumentFile(req.file, req.file.originalname);

    const document = await createDocument({
      studentId: student.id,
      academicPeriodId,
      title,
      documentType,
      storagePath
    });

    try {
      await assignDocumentWithBalance(document.id, req.user.userId);
    } catch (assignError) {
      console.error('No se pudo asignar revisor automáticamente:', assignError.message);
    }

    return res.status(201).json({ document });
  } catch (error) {
    next(error);
  }
});

router.get('/file-url', requireAuth, async (req, res, next) => {
  try {
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({ message: 'Ruta de archivo requerida' });
    }

    const url = await getSignedUrl(path);
    const fileType = getFileType(path);
    const fileName = getFileName(path);

    return res.json({ url, fileType, fileName });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const document = await getDocumentById(req.params.id, req.user.userId, req.user.role);
    return res.json({ document });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/assign', requireAuth, requireRole('admin', 'coordinator'), async (req, res, next) => {
  try {
    const { reviewerId, auto } = req.body || {};

    const assignment = auto
      ? await assignDocumentWithBalance(req.params.id, req.user.userId)
      : await assignDocumentToReviewer(req.params.id, reviewerId, req.user.userId);

    return res.status(201).json({ assignment });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/observations', requireAuth, requireRole('reviewer'), async (req, res, next) => {
  try {
    const { observation, severity } = req.body || {};

    if (!observation) {
      return res.status(400).json({ message: 'La observación es obligatoria' });
    }

    const result = await addObservation({
      documentId: req.params.id,
      reviewerId: req.user.userId,
      observation,
      severity
    });

    return res.status(201).json({ observation: result });
  } catch (error) {
    next(error);
  }
});

router.patch('/observations/:id/resolve', requireAuth, async (req, res, next) => {
  try {
    const observation = await resolveObservation(req.params.id, req.user.userId, req.user.role);
    return res.json({ observation });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/correction', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const { storagePath, notes } = req.body || {};
    const document = await submitCorrection(req.params.id, req.user.userId, { storagePath, notes });
    return res.json({ document });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/decision', requireAuth, requireRole('reviewer'), async (req, res, next) => {
  try {
    const { decision, notes } = req.body || {};

    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ message: 'Decisión inválida' });
    }

    const document = await decideDocument(req.params.id, req.user.userId, decision, notes);
    return res.json({ document });
  } catch (error) {
    next(error);
  }
});

export default router;
