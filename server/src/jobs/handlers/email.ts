import type { Processor } from 'bullmq';
import { logger } from '../../lib/logger.js';
import { sendEmail } from '../../services/email.js';
import {
  welcomeEmail,
  passwordResetEmail,
  verifyEmail,
  inviteEmail,
  invoiceEmail,
} from '../../services/email-templates.js';

/**
 * EmailJobData supports two shapes:
 *   1. Direct HTML — sender supplies raw `html` (existing callers)
 *   2. Template — sender supplies `template` name + `params`, worker renders
 *
 * Template variant lets producers stay decoupled from HTML/template engine.
 */
export type EmailJobData =
  | { to: string | string[]; subject: string; html: string; text?: string }
  | {
      to: string | string[];
      subject: string;
      template: 'welcome';
      params: { name: string; appUrl: string };
    }
  | {
      to: string | string[];
      subject: string;
      template: 'password-reset';
      params: { name: string; resetUrl: string; expiresInMinutes: number };
    }
  | {
      to: string | string[];
      subject: string;
      template: 'verify-email';
      params: { name: string; verifyUrl: string };
    }
  | {
      to: string | string[];
      subject: string;
      template: 'invite';
      params: { inviterName: string; inviteUrl: string; appName: string };
    }
  | {
      to: string | string[];
      subject: string;
      template: 'invoice';
      params: { name: string; invoiceNumber: string; amount: string; dueDate: string; payUrl: string };
    };

function renderTemplate(data: EmailJobData): string {
  if ('html' in data) return data.html;
  switch (data.template) {
    case 'welcome':
      return welcomeEmail(data.params);
    case 'password-reset':
      return passwordResetEmail(data.params);
    case 'verify-email':
      return verifyEmail(data.params);
    case 'invite':
      return inviteEmail(data.params);
    case 'invoice':
      return invoiceEmail(data.params);
  }
}

export const emailProcessor: Processor<EmailJobData> = async (job) => {
  const html = renderTemplate(job.data);
  const result = await sendEmail({
    to: job.data.to,
    subject: job.data.subject,
    html,
    ...('text' in job.data && job.data.text ? { text: job.data.text } : {}),
  });
  logger.info(
    { jobId: job.id, to: job.data.to, provider: result.provider, sent: result.sent, id: result.id },
    'email job processed',
  );
  return result;
};
