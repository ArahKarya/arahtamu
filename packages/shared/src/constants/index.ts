export const APP_NAME = 'ArahTamu';
export const APP_VERSION = '0.1.0';

export const BRANDING = {
  APP_NAME: 'ArahTamu',
  LEGAL_NAME: 'PT Arah Karya Sinergi',
  COPYRIGHT: '© ArahTamu — PT Arah Karya Sinergi',
  LOGO_LIGHT: '/icons/icon-arah-bk.png',
  LOGO_DARK: '/icons/icon-arah-wh.png',
  LOGO_192: '/icons/icon-192.png',
  LOGO_512: '/icons/icon-512.png',
} as const;

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN', // operator platform (lintas tenant)
  ADMIN: 'ADMIN', // admin tenant
  RECEPTIONIST: 'RECEPTIONIST', // resepsionis: kelola tamu walk-in, cetak badge
  HOST: 'HOST', // karyawan yang dituju/mengundang tamu
  SECURITY: 'SECURITY', // pantau gedung, watchlist
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  ROLE_READ: 'role:read',
  ROLE_WRITE: 'role:write',
  AUDIT_READ: 'audit:read',
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',
  FILE_UPLOAD: 'file:upload',
  FILE_DELETE: 'file:delete',
  BACKUP_CREATE: 'backup:create',
  BACKUP_RESTORE: 'backup:restore',
  REPORT_READ: 'report:read',
  REPORT_EXPORT: 'report:export',
  JOB_READ: 'job:read',
  JOB_MANAGE: 'job:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const JOB_QUEUES = {
  EMAIL: 'email',
  EXPORT: 'export',
  REPORT: 'report',
  NOTIFICATION: 'notification',
  CLEANUP: 'cleanup',
} as const;

export type JobQueueName = (typeof JOB_QUEUES)[keyof typeof JOB_QUEUES];

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
  BACKUP: 'BACKUP',
  RESTORE: 'RESTORE',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
