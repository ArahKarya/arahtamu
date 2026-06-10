import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { usersRouter } from '../modules/users/users.routes.js';
import { rolesRouter } from '../modules/roles/roles.routes.js';
import { auditRouter } from '../modules/audit/audit.routes.js';
import { settingsRouter } from '../modules/settings/settings.routes.js';
import { notificationsRouter } from '../modules/notifications/notifications.routes.js';
import { uploadsRouter } from '../modules/uploads/uploads.routes.js';
import { healthRouter } from '../modules/health/health.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/roles', rolesRouter);
apiRouter.use('/audit-logs', auditRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/uploads', uploadsRouter);
// ROUTES_GENERATOR_MARKER
