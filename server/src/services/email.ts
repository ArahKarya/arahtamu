import { Resend } from 'resend';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  sent: boolean;
  id?: string;
  provider: 'resend' | 'log';
}

let resendClient: Resend | null = null;
function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(env.RESEND_API_KEY);
  return resendClient;
}

/**
 * Send email via Resend if configured, otherwise log to stdout (dev-friendly).
 * Always returns success-shape — caller should use `result.sent` to verify.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const client = getResend();
  if (!client) {
    logger.info(
      { to: input.to, subject: input.subject },
      '[email] RESEND_API_KEY not set — email logged only',
    );
    if (process.env.NODE_ENV !== 'production') {
      logger.debug({ html: input.html.slice(0, 200) }, '[email] body preview');
    }
    return { sent: false, provider: 'log' };
  }

  try {
    const { data, error } = await client.emails.send({
      from: env.EMAIL_FROM,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      ...(input.text ? { text: input.text } : {}),
      ...(input.replyTo || env.EMAIL_REPLY_TO
        ? { replyTo: input.replyTo ?? env.EMAIL_REPLY_TO! }
        : {}),
    });
    if (error) {
      logger.error({ err: error, to: input.to }, '[email] Resend send failed');
      throw error;
    }
    return { sent: true, id: data?.id, provider: 'resend' };
  } catch (err) {
    logger.error({ err, to: input.to }, '[email] send threw');
    throw err;
  }
}
