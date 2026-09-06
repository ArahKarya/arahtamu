import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import type { AuthTokens, AuthUser, LoginInput } from '@fdm/shared';
import { prisma } from '../../lib/prisma.js';
import {
  parseDurationToSeconds,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../lib/jwt.js';
import { UnauthorizedError } from '../../lib/errors.js';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { recordAudit } from '../../middleware/audit.js';

const hashRefreshToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
const newFamilyId = () => crypto.randomUUID();

async function buildAuthUser(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      roles: {
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      },
    },
  });
  const roles = user.roles.map((ur) => ur.role.name);
  const permissions = Array.from(
    new Set(user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.key))),
  );
  return { id: user.id, email: user.email, name: user.name, roles, permissions };
}

interface IssueOpts {
  ip: string | null;
  userAgent?: string | null;
  /** Existing familyId for rotation; omit to start a new family on fresh login. */
  familyId?: string;
  /** Returned id used to mark the predecessor's `replacedById` for forensics. */
  predecessorTokenId?: string;
}

async function issueTokens(user: AuthUser, opts: IssueOpts): Promise<AuthTokens> {
  const payload = { sub: user.id, email: user.email, roles: user.roles };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const expiresAt = new Date(Date.now() + parseDurationToSeconds(env.JWT_REFRESH_EXPIRES_IN) * 1000);
  const familyId = opts.familyId ?? newFamilyId();

  const created = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      familyId,
      expiresAt,
      ip: opts.ip,
      userAgent: opts.userAgent ?? null,
    },
  });

  if (opts.predecessorTokenId) {
    await prisma.refreshToken.update({
      where: { id: opts.predecessorTokenId },
      data: { replacedById: created.id },
    });
  }

  return {
    accessToken,
    refreshToken,
    expiresIn: parseDurationToSeconds(env.JWT_ACCESS_EXPIRES_IN),
  };
}

export async function login(input: LoginInput, ip: string | null, userAgent: string | null) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.isActive) {
    await recordAudit({
      userId: null,
      userEmail: input.email,
      action: 'LOGIN_FAILED',
      entity: 'auth',
      ip,
      userAgent,
      diff: null,
    });
    throw UnauthorizedError('Email atau password salah');
  }

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    await recordAudit({
      userId: user.id,
      userEmail: user.email,
      action: 'LOGIN_FAILED',
      entity: 'auth',
      ip,
      userAgent,
      diff: null,
    });
    throw UnauthorizedError('Email atau password salah');
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const authUser = await buildAuthUser(user.id);
  const tokens = await issueTokens(authUser, { ip, userAgent });

  await recordAudit({
    userId: user.id,
    userEmail: user.email,
    action: 'LOGIN',
    entity: 'auth',
    ip,
    userAgent,
    diff: null,
  });

  return { user: authUser, tokens };
}

export async function refresh(refreshToken: string, ip: string | null, userAgent: string | null) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw UnauthorizedError('Refresh token tidak valid');
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored) {
    throw UnauthorizedError('Refresh token tidak dikenal');
  }

  // Reuse detection: token is already revoked → attacker likely replayed an intercepted
  // token. Revoke the entire family so the legitimate session is force-logged-out too.
  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'reuse_detected' },
    });
    await recordAudit({
      userId: stored.userId,
      userEmail: null,
      action: 'TOKEN_REUSE_DETECTED',
      entity: 'auth',
      ip,
      userAgent,
      diff: { familyId: stored.familyId, tokenId: stored.id },
    });
    logger.warn(
      { userId: stored.userId, familyId: stored.familyId, tokenId: stored.id, ip },
      'refresh-token reuse detected, family revoked',
    );
    throw UnauthorizedError('Sesi tidak valid — silakan login ulang');
  }

  if (stored.expiresAt < new Date()) {
    throw UnauthorizedError('Refresh token kedaluwarsa');
  }

  // Rotate: revoke old, issue new with same familyId.
  await prisma.refreshToken.update({
    where: { tokenHash },
    data: { revokedAt: new Date(), revokedReason: 'rotated' },
  });

  const authUser = await buildAuthUser(payload.sub);
  const tokens = await issueTokens(authUser, {
    ip,
    userAgent,
    familyId: stored.familyId,
    predecessorTokenId: stored.id,
  });
  return { user: authUser, tokens };
}

export async function logout(refreshToken: string) {
  const tokenHash = hashRefreshToken(refreshToken);
  await prisma.refreshToken
    .update({ where: { tokenHash }, data: { revokedAt: new Date(), revokedReason: 'logout' } })
    .catch(() => undefined);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw UnauthorizedError('Password saat ini salah');
  const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: 'password_changed' },
  });
}

export async function me(userId: string) {
  return buildAuthUser(userId);
}
