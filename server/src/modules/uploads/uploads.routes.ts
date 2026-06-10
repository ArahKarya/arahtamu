import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import { ok, fail, PERMISSIONS } from '@arahtamu/shared';
import { authenticate, type AuthenticatedRequest } from '../../middleware/auth.js';
import { requirePermissions } from '../../middleware/rbac.js';
import { audit } from '../../middleware/audit.js';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { NotFoundError, ForbiddenError } from '../../lib/errors.js';

// Whitelist MIME types — extend per app, JANGAN allow '*' atau executables.
const ALLOWED_MIME = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'text/csv',
  'text/plain',
]);

// Sanitize filename — strip path traversal, keep only alnum + dash + dot.
const safeStoredName = (original: string): string => {
  const ext = path.extname(original).toLowerCase().slice(0, 10);
  const random = crypto.randomBytes(16).toString('hex');
  return `${Date.now()}-${random}${ext}`;
};

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await fs.mkdir(env.UPLOAD_DIR, { recursive: true });
    cb(null, env.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => cb(null, safeStoredName(file.originalname)),
});

const upload = multer({
  storage,
  limits: {
    fileSize: env.UPLOAD_MAX_SIZE_MB * 1024 * 1024,
    files: 5,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error(`MIME type ${file.mimetype} tidak diizinkan`));
      return;
    }
    cb(null, true);
  },
});

export const uploadsRouter = Router();

uploadsRouter.use(authenticate);

uploadsRouter.post(
  '/',
  requirePermissions(PERMISSIONS.FILE_UPLOAD),
  audit('CREATE', 'file_upload'),
  upload.single('file'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json(fail('NO_FILE', 'File tidak ditemukan di body (field: file)'));
        return;
      }
      const entity = typeof req.body?.entity === 'string' ? req.body.entity : null;
      const entityId = typeof req.body?.entityId === 'string' ? req.body.entityId : null;

      const record = await prisma.fileUpload.create({
        data: {
          userId: req.user!.id,
          originalName: req.file.originalname,
          storedName: req.file.filename,
          mimeType: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
          entity,
          entityId,
        },
      });
      res.status(201).json(ok(record));
    } catch (err) {
      next(err);
    }
  },
);

uploadsRouter.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const record = await prisma.fileUpload.findUnique({ where: { id: String(req.params.id) } });
    if (!record) throw NotFoundError('FileUpload', String(req.params.id));
    res.json(ok(record));
  } catch (err) {
    next(err);
  }
});

uploadsRouter.get('/:id/download', async (req: AuthenticatedRequest, res, next) => {
  try {
    const record = await prisma.fileUpload.findUnique({ where: { id: String(req.params.id) } });
    if (!record) throw NotFoundError('FileUpload', String(req.params.id));
    res.download(record.path, record.originalName);
  } catch (err) {
    next(err);
  }
});

uploadsRouter.delete(
  '/:id',
  requirePermissions(PERMISSIONS.FILE_DELETE),
  audit('DELETE', 'file_upload'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const record = await prisma.fileUpload.findUnique({ where: { id: String(req.params.id) } });
      if (!record) throw NotFoundError('FileUpload', String(req.params.id));
      // Owner OR file:delete permission required (already gated by middleware).
      if (record.userId && record.userId !== req.user!.id) {
        const isAdmin = req.user!.permissions.includes(PERMISSIONS.FILE_DELETE);
        if (!isAdmin) throw ForbiddenError('Bukan pemilik file');
      }
      await fs.unlink(record.path).catch(() => undefined);
      await prisma.fileUpload.delete({ where: { id: record.id } });
      res.json(ok({ deleted: true }));
    } catch (err) {
      next(err);
    }
  },
);
