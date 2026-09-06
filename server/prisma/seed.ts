import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ROLES, PERMISSIONS } from '@fdm/shared';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);

async function seedPermissions() {
  const keys = Object.values(PERMISSIONS);
  await Promise.all(
    keys.map((key) =>
      prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key, description: key },
      }),
    ),
  );
  return prisma.permission.findMany();
}

async function seedRoles() {
  const allPermissions = await seedPermissions();

  const superAdmin = await prisma.role.upsert({
    where: { name: ROLES.SUPER_ADMIN },
    update: {},
    create: {
      name: ROLES.SUPER_ADMIN,
      description: 'Akses penuh ke semua fitur',
      isSystem: true,
    },
  });

  await prisma.rolePermission.deleteMany({ where: { roleId: superAdmin.id } });
  await prisma.rolePermission.createMany({
    data: allPermissions.map((p) => ({ roleId: superAdmin.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  // ── Peta permission per peran VMS ──────────────────────────────────────────
  const P = PERMISSIONS;
  const allKeys = allPermissions.map((p) => p.key);

  // ADMIN tenant: kelola seluruh fitur (SUPER_ADMIN tetap bypass total).
  const ADMIN_PERMS = allKeys;

  // Resepsionis: operasi meja depan (tamu, kunjungan, lihat master, cetak/foto).
  const RECEPTIONIST_PERMS: string[] = [
    P.VISIT_READ, P.VISIT_WRITE, P.VISIT_CONFIRM,
    P.VISITOR_READ, P.VISITOR_WRITE,
    P.HOST_READ, P.LOCATION_READ, P.DEPARTMENT_READ,
    P.PREREGISTRATION_READ, P.WATCHLIST_READ, P.CONSENT_READ,
    P.REPORT_READ, P.FILE_UPLOAD,
  ];

  // Host (karyawan dituju): undang tamu + lihat kunjungannya.
  const HOST_PERMS: string[] = [
    P.PREREGISTRATION_READ, P.PREREGISTRATION_WRITE,
    P.VISIT_READ, P.VISIT_CONFIRM, P.VISITOR_READ,
    P.HOST_READ, P.LOCATION_READ, P.FILE_UPLOAD,
  ];

  // Security: pantau gedung + kelola watchlist + audit.
  const SECURITY_PERMS: string[] = [
    P.VISIT_READ, P.VISITOR_READ,
    P.WATCHLIST_READ, P.WATCHLIST_WRITE, P.WATCHLIST_DELETE,
    P.LOCATION_READ, P.HOST_READ, P.REPORT_READ, P.AUDIT_READ,
  ];

  async function assignRole(name: string, description: string, permKeys: string[]) {
    const role = await prisma.role.upsert({
      where: { name },
      update: { description },
      create: { name, description, isSystem: true },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    const data = allPermissions
      .filter((p) => permKeys.includes(p.key))
      .map((p) => ({ roleId: role.id, permissionId: p.id }));
    if (data.length > 0) {
      await prisma.rolePermission.createMany({ data, skipDuplicates: true });
    }
  }

  await assignRole(ROLES.ADMIN, 'Admin organisasi — kelola seluruh fitur', ADMIN_PERMS);
  await assignRole(ROLES.RECEPTIONIST, 'Resepsionis — kelola tamu & kunjungan', RECEPTIONIST_PERMS);
  await assignRole(ROLES.HOST, 'Host — undang tamu & lihat kunjungan', HOST_PERMS);
  await assignRole(ROLES.SECURITY, 'Security — pantau gedung & watchlist', SECURITY_PERMS);

  return superAdmin;
}

async function seedAdminUser(superAdminRoleId: string) {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@fdm.local';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: 'Super Admin',
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: superAdminRoleId } },
    update: {},
    create: { userId: user.id, roleId: superAdminRoleId },
  });

  console.log(`[seed] admin user ready: ${email} / ${password}`);
}

async function seedSettings() {
  const defaults: Array<{ key: string; value: unknown }> = [
    { key: 'company.name', value: 'FDM Demo' },
    { key: 'company.address', value: '' },
    { key: 'app.timezone', value: 'Asia/Jakarta' },
    { key: 'app.locale', value: 'id-ID' },
  ];

  for (const { key, value } of defaults) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: value as any },
    });
  }
}

async function main() {
  console.log('[seed] start');
  const superAdmin = await seedRoles();
  await seedAdminUser(superAdmin.id);
  await seedSettings();
  console.log('[seed] done');
}

main()
  .catch((err) => {
    console.error('[seed] error', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
