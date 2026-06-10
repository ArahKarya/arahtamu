import { JOB_QUEUES } from '@arahtamu/shared';
import { createWorker, enqueue } from '../services/queue.js';
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

  // Cron retensi UU PDP: hapus data tamu kedaluwarsa tiap hari pukul 03:00.
  void enqueue(
    JOB_QUEUES.CLEANUP,
    'visitor-retention',
    { task: 'visitor-retention' as const },
    { repeat: { pattern: '0 3 * * *' }, jobId: 'cron-visitor-retention' },
  );

  logger.info(`[worker] started ${workers.length} workers`);
  return workers;
}
