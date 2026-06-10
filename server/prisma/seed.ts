import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ROLES, PERMISSIONS } from '@arahtamu/shared';

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

  for (const name of [ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.HOST, ROLES.SECURITY]) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, description: name, isSystem: true },
    });
  }

  return superAdmin;
}

async function seedAdminUser(superAdminRoleId: string) {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@arahtamu.local';
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
    { key: 'company.name', value: 'ArahTamu Demo' },
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
