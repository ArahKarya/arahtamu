import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { usersRouter } from '../modules/users/users.routes.js';
import { rolesRouter } from '../modules/roles/roles.routes.js';
import { auditRouter } from '../modules/audit/audit.routes.js';
import { settingsRouter } from '../modules/settings/settings.routes.js';
import { notificationsRouter } from '../modules/notifications/notifications.routes.js';
import { uploadsRouter } from '../modules/uploads/uploads.routes.js';
import { healthRouter } from '../modules/health/health.routes.js';
import { departmentRouter } from '../modules/department/department.routes.js';
import { locationRouter } from '../modules/location/location.routes.js';
import { hostRouter } from '../modules/host/host.routes.js';
import { visitorRouter } from '../modules/visitor/visitor.routes.js';
import { visitRouter } from '../modules/visit/visit.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/roles', rolesRouter);
apiRouter.use('/audit-logs', auditRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/uploads', uploadsRouter);
apiRouter.use('/departments', departmentRouter);
apiRouter.use('/locations', locationRouter);
apiRouter.use('/hosts', hostRouter);
apiRouter.use('/visitors', visitorRouter);
apiRouter.use('/visits', visitRouter);
// ROUTES_GENERATOR_MARKER
