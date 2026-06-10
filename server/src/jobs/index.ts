import { JOB_QUEUES } from '@arahtamu/shared';
import { createWorker } from '../services/queue.js';
import { logger } from '../lib/logger.js';
import { emailProcessor } from './handlers/email.js';
import { exportProcessor } from './handlers/export.js';
import { reportProcessor } from './handlers/report.js';
import { notificationProcessor } from './handlers/notification.js';
import { cleanupProcessor } from './handlers/cleanup.js';

export function startWorkers() {
  const workers = [
    createWorker(JOB_QUEUES.EMAIL, emailProcessor),
    createWorker(JOB_QUEUES.EXPORT, exportProcessor),
    createWorker(JOB_QUEUES.REPORT, reportProcessor),
    createWorker(JOB_QUEUES.NOTIFICATION, notificationProcessor),
    createWorker(JOB_QUEUES.CLEANUP, cleanupProcessor),
  ];
  logger.info(`[worker] started ${workers.length} workers`);
  return workers;
}
