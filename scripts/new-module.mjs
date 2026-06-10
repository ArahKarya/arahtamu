#!/usr/bin/env node
/**
 * ArahKarya Module Generator
 *
 * Usage:
 *   pnpm new:module <name>                  # Simple module (routes + service)
 *   pnpm new:module <name> --layered        # Layered (routes + service + repository + types)
 *   pnpm new:module <name> --entity=Name    # Custom Pascal entity name
 *
 * Naming convention:
 *   input:        customer-order
 *   kebab (file): customer-order            # file names, dir name, URL path stem
 *   snake (DB):   customer_order            # @@map(), permission key
 *   camel:        customerOrder             # variable name in code
 *   Pascal:       CustomerOrder             # type, class, component
 *   route plural: customer-orders           # /api/customer-orders
 *
 * Generated files:
 *   - packages/shared/src/schemas/<kebab>.ts
 *   - server/src/modules/<kebab>/<kebab>.routes.ts
 *   - server/src/modules/<kebab>/<kebab>.service.ts
 *   - server/src/modules/<kebab>/<kebab>.routes.test.ts          [NEW: test scaffold]
 *   - client/src/pages/<Pascal>Page.tsx
 *   + layered: <kebab>.repository.ts + <kebab>.types.ts
 *
 * Auto-patches:
 *   - packages/shared/src/schemas/index.ts   (export)
 *   - server/src/routes/index.ts             (mount router)         [via // ROUTES_GENERATOR_MARKER]
 *   - client/src/App.tsx                     (add Route)            [via {/* ROUTES_GENERATOR_MARKER */}]
 *   - client/src/layouts/AppLayout.tsx       (add nav item)         [via // NAV_GENERATOR_MARKER]
 *
 * Reminders printed (manual):
 *   1. Add Prisma model + migrate
 *   2. Add permission keys to packages/shared/src/constants/index.ts + re-seed
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// ─── Args & validation ─────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('--'));
const positional = args.filter((a) => !a.startsWith('--'));

const rawName = positional[0];
if (!rawName) {
  console.error('Usage: pnpm new:module <name> [--layered] [--entity=Pascal]');
  process.exit(1);
}

const RESERVED = new Set([
  'auth', 'users', 'user', 'roles', 'role', 'health', 'settings', 'setting',
  'uploads', 'upload', 'notifications', 'notification', 'audit', 'audit-logs',
  'admin', 'api', 'app', 'shared', 'common', 'lib', 'utils', 'config',
  'middleware', 'jobs', 'queue', 'queues', 'system', 'tenant', 'tenants',
]);

const NAME_PATTERN = /^[a-z][a-z0-9]*(?:[-_][a-z0-9]+)*$/;
const normalizedInput = rawName.toLowerCase().replace(/_/g, '-');
if (!NAME_PATTERN.test(normalizedInput) || normalizedInput.length > 31) {
  console.error(`Error: invalid name "${rawName}".`);
  console.error('  Use lowercase letters, digits, hyphens or underscores.');
  console.error('  Must start with a letter, max 31 chars (e.g. "customer-order", "invoice").');
  process.exit(1);
}
if (RESERVED.has(normalizedInput)) {
  console.error(`Error: "${normalizedInput}" is a reserved module name. Pick a different one.`);
  process.exit(1);
}

const entityFlag = flags.find((f) => f.startsWith('--entity='));
const isLayered = flags.includes('--layered');

// ─── Naming derivations ────────────────────────────────────────────────────

const kebab = normalizedInput;                         // customer-order
const snake = kebab.replace(/-/g, '_');                // customer_order
const camel = kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()); // customerOrder
const Pascal = entityFlag
  ? entityFlag.split('=')[1]
  : camel.charAt(0).toUpperCase() + camel.slice(1);    // CustomerOrder
const pluralKebab = `${kebab}s`;                       // customer-orders
const pluralSnake = `${snake}s`;                       // customer_orders

// Existing single-word modules use `${name}` for everything; multi-word uses kebab files
// + snake for DB. Permission key uses snake to match constants convention.
const permissionKey = snake;

// ─── Templates ─────────────────────────────────────────────────────────────

const schemaFile = `import { z } from 'zod';

export const create${Pascal}Schema = z.object({
  name: z.string().trim().min(1).max(200),
  // TODO: tambah field sesuai entity ${Pascal}
});

export const update${Pascal}Schema = create${Pascal}Schema.partial();

export type Create${Pascal}Input = z.infer<typeof create${Pascal}Schema>;
export type Update${Pascal}Input = z.infer<typeof update${Pascal}Schema>;
`;

const pageTsx = `import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface ${Pascal}Row {
  id: string;
  name: string;
}

export function ${Pascal}Page() {
  const { data, isLoading } = useQuery({
    queryKey: ['${kebab}'],
    queryFn: async (): Promise<${Pascal}Row[]> => {
      const res = await api.get<{ data: ${Pascal}Row[] }>('/${pluralKebab}', {
        params: { page: 1, limit: 50 },
      });
      return res.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="${Pascal}"
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        }
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="ml-auto h-4 w-12" /></TableCell>
                </TableRow>
              ))}
            {!isLoading && (!data || data.length === 0) && (
              <TableRow>
                <TableCell colSpan={2}>
                  <EmptyState title="Belum ada data ${kebab}" />
                </TableCell>
              </TableRow>
            )}
            {data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
`;

const simpleService = `import type { PaginationQuery, Create${Pascal}Input, Update${Pascal}Input } from '@arahtamu/shared';
import { buildPagination, toSkipTake } from '@arahtamu/shared';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';

const model = (prisma as unknown as Record<string, {
  findMany: (args: unknown) => Promise<unknown[]>;
  count: (args: unknown) => Promise<number>;
  findUnique: (args: unknown) => Promise<unknown | null>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
}>)['${camel}'];

export async function list(q: PaginationQuery) {
  const { skip, take } = toSkipTake(q.page, q.limit);
  const where: Record<string, unknown> = q.search
    ? { name: { contains: q.search, mode: 'insensitive' } }
    : {};
  const [items, total] = await Promise.all([
    model.findMany({ where, skip, take, orderBy: { createdAt: q.sortOrder } }),
    model.count({ where }),
  ]);
  return buildPagination(items, total, q.page, q.limit);
}

export async function get(id: string) {
  const item = await model.findUnique({ where: { id } });
  if (!item) throw NotFoundError('${Pascal}', id);
  return item;
}

export async function create(input: Create${Pascal}Input) {
  return model.create({ data: input });
}

export async function update(id: string, input: Update${Pascal}Input) {
  await get(id);
  return model.update({ where: { id }, data: input });
}

export async function remove(id: string) {
  await get(id);
  await model.delete({ where: { id } });
}
`;

const layeredTypes = `export interface ${Pascal}Entity {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
`;

const layeredRepository = `import { BaseRepository } from '../../lib/base-repository.js';
import type { ${Pascal}Entity } from './${kebab}.types.js';

class ${Pascal}RepositoryImpl extends BaseRepository<${Pascal}Entity> {
  constructor() {
    super('${camel}');
  }

  buildSearchWhere(search?: string): Record<string, unknown> {
    if (!search) return {};
    return { name: { contains: search, mode: 'insensitive' } };
  }
}

export const ${camel}Repository = new ${Pascal}RepositoryImpl();
`;

const layeredService = `import type { PaginationQuery, Create${Pascal}Input, Update${Pascal}Input } from '@arahtamu/shared';
import { ${camel}Repository } from './${kebab}.repository.js';

export async function list(q: PaginationQuery) {
  const where = ${camel}Repository.buildSearchWhere(q.search);
  return ${camel}Repository.findMany(q, where);
}

export async function get(id: string) {
  return ${camel}Repository.findById(id);
}

export async function create(input: Create${Pascal}Input) {
  return ${camel}Repository.create(input as unknown as Record<string, unknown>);
}

export async function update(id: string, input: Update${Pascal}Input) {
  return ${camel}Repository.update(id, input as unknown as Record<string, unknown>);
}

export async function remove(id: string) {
  return ${camel}Repository.delete(id);
}
`;

const routesFile = `import { Router } from 'express';
import { ok, paginationQuerySchema } from '@arahtamu/shared';
import { authenticate } from '../../middleware/auth.js';
import { audit } from '../../middleware/audit.js';
import { requirePermissions } from '../../middleware/rbac.js';
import { validate, getValidated } from '../../middleware/validate.js';
import { create${Pascal}Schema, update${Pascal}Schema } from '@arahtamu/shared';
import type { Create${Pascal}Input, Update${Pascal}Input, PaginationQuery } from '@arahtamu/shared';
import * as svc from './${kebab}.service.js';

export const ${camel}Router = Router();

${camel}Router.use(authenticate);

${camel}Router.get(
  '/',
  requirePermissions('${permissionKey}:read'),
  validate(paginationQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const q = getValidated<PaginationQuery>(req, 'query');
      const result = await svc.list(q);
      res.json(ok(result.items, result.meta));
    } catch (err) {
      next(err);
    }
  },
);

${camel}Router.get(
  '/:id',
  requirePermissions('${permissionKey}:read'),
  async (req, res, next) => {
    try {
      res.json(ok(await svc.get(req.params.id)));
    } catch (err) {
      next(err);
    }
  },
);

${camel}Router.post(
  '/',
  requirePermissions('${permissionKey}:write'),
  validate(create${Pascal}Schema),
  audit('CREATE', '${snake}'),
  async (req, res, next) => {
    try {
      const input = getValidated<Create${Pascal}Input>(req);
      res.status(201).json(ok(await svc.create(input)));
    } catch (err) {
      next(err);
    }
  },
);

${camel}Router.patch(
  '/:id',
  requirePermissions('${permissionKey}:write'),
  validate(update${Pascal}Schema),
  audit('UPDATE', '${snake}'),
  async (req, res, next) => {
    try {
      const input = getValidated<Update${Pascal}Input>(req);
      res.json(ok(await svc.update(req.params.id, input)));
    } catch (err) {
      next(err);
    }
  },
);

${camel}Router.delete(
  '/:id',
  requirePermissions('${permissionKey}:delete'),
  audit('DELETE', '${snake}'),
  async (req, res, next) => {
    try {
      await svc.remove(req.params.id);
      res.json(ok({ deleted: true }));
    } catch (err) {
      next(err);
    }
  },
);
`;

// Test scaffold — supertest + Vitest, focuses on auth/RBAC/validation per testing rules.
// Replace TODO blocks with real DB-backed assertions (Postgres test container).
const routesTest = `import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';

const app = createApp();

describe('${Pascal} routes', () => {
  describe('auth & rbac', () => {
    it('GET /api/${pluralKebab} rejects without token', async () => {
      const res = await request(app).get('/api/${pluralKebab}');
      expect(res.status).toBe(401);
    });

    it('POST /api/${pluralKebab} rejects without token', async () => {
      const res = await request(app)
        .post('/api/${pluralKebab}')
        .send({ name: 'Test' });
      expect(res.status).toBe(401);
    });

    // TODO: test reject without permission '${permissionKey}:write' (login as VIEWER → expect 403)
    // TODO: test happy path create → list → update → delete with ADMIN token + Postgres container
    // TODO: test invalid input rejected (Zod validation)
  });

  describe('validation', () => {
    it('POST /api/${pluralKebab} rejects empty body shape (when authed)', async () => {
      // Placeholder until test auth helper is wired.
      // const token = await loginAsAdmin();
      // const res = await request(app)
      //   .post('/api/${pluralKebab}')
      //   .set('Authorization', \`Bearer \${token}\`)
      //   .send({});
      // expect(res.status).toBe(400);
      expect(true).toBe(true);
    });
  });
});
`;

// ─── File map ──────────────────────────────────────────────────────────────

const files = {
  [`packages/shared/src/schemas/${kebab}.ts`]: schemaFile,
  [`server/src/modules/${kebab}/${kebab}.routes.ts`]: routesFile,
  [`server/src/modules/${kebab}/${kebab}.routes.test.ts`]: routesTest,
  [`client/src/pages/${Pascal}Page.tsx`]: pageTsx,
};

if (isLayered) {
  files[`server/src/modules/${kebab}/${kebab}.types.ts`] = layeredTypes;
  files[`server/src/modules/${kebab}/${kebab}.repository.ts`] = layeredRepository;
  files[`server/src/modules/${kebab}/${kebab}.service.ts`] = layeredService;
} else {
  files[`server/src/modules/${kebab}/${kebab}.service.ts`] = simpleService;
}

// ─── Writers ───────────────────────────────────────────────────────────────

async function writeFile(rel, content) {
  const full = path.join(root, rel);
  await fs.mkdir(path.dirname(full), { recursive: true });
  try {
    await fs.access(full);
    console.log(`  [skip] ${rel} (already exists)`);
    return false;
  } catch {
    // not exists, proceed
  }
  await fs.writeFile(full, content, 'utf8');
  console.log(`  [write] ${rel}`);
  return true;
}

async function patchSharedIndex() {
  const indexPath = path.join(root, 'packages/shared/src/schemas/index.ts');
  const content = await fs.readFile(indexPath, 'utf8');
  const line = `export * from './${kebab}.js';`;
  if (content.includes(line)) {
    console.log(`  [skip] packages/shared/src/schemas/index.ts (already exports)`);
    return;
  }
  await fs.writeFile(indexPath, content.trimEnd() + '\n' + line + '\n', 'utf8');
  console.log(`  [patch] packages/shared/src/schemas/index.ts (+ ${kebab})`);
}

async function patchServerRoutes() {
  const file = path.join(root, 'server/src/routes/index.ts');
  const content = await fs.readFile(file, 'utf8');
  if (content.includes(`/${kebab}/${kebab}.routes.js`)) {
    console.log(`  [skip] server/src/routes/index.ts (already mounted)`);
    return;
  }
  const importLine = `import { ${camel}Router } from '../modules/${kebab}/${kebab}.routes.js';\n`;
  const useLine = `apiRouter.use('/${pluralKebab}', ${camel}Router);\n`;
  const marker = '// ROUTES_GENERATOR_MARKER';
  if (!content.includes(marker)) {
    console.log(`  [warn] server/src/routes/index.ts missing ${marker}, adding manually:`);
    console.log(`         ${importLine.trim()}`);
    console.log(`         ${useLine.trim()}`);
    return;
  }
  // Insert import after last import block
  const lastImportEnd = content.lastIndexOf("from '..");
  const lastImportLineEnd = content.indexOf('\n', lastImportEnd) + 1;
  let patched = content.slice(0, lastImportLineEnd) + importLine + content.slice(lastImportLineEnd);
  // Insert useLine BEFORE marker
  patched = patched.replace(marker, useLine + marker);
  await fs.writeFile(file, patched, 'utf8');
  console.log(`  [patch] server/src/routes/index.ts (+ /${pluralKebab})`);
}

async function patchClientApp() {
  const file = path.join(root, 'client/src/App.tsx');
  const content = await fs.readFile(file, 'utf8');
  if (content.includes(`./pages/${Pascal}Page`)) {
    console.log(`  [skip] client/src/App.tsx (already routed)`);
    return;
  }
  const importLine = `import { ${Pascal}Page } from './pages/${Pascal}Page';\n`;
  const routeLine = `          <Route path="${pluralKebab}" element={<${Pascal}Page />} />\n`;
  const marker = '{/* ROUTES_GENERATOR_MARKER */}';
  if (!content.includes(marker)) {
    console.log(`  [warn] client/src/App.tsx missing ${marker}, adding manually:`);
    console.log(`         ${importLine.trim()}`);
    console.log(`         ${routeLine.trim()}`);
    return;
  }
  const lastImportLineEnd =
    content.indexOf('\n', content.lastIndexOf("from './")) + 1;
  let patched = content.slice(0, lastImportLineEnd) + importLine + content.slice(lastImportLineEnd);
  patched = patched.replace(marker, routeLine.trimEnd() + '\n          ' + marker);
  await fs.writeFile(file, patched, 'utf8');
  console.log(`  [patch] client/src/App.tsx (+ /${pluralKebab})`);
}

async function patchClientNav() {
  const file = path.join(root, 'client/src/layouts/AppLayout.tsx');
  const content = await fs.readFile(file, 'utf8');
  if (content.includes(`to: '/${pluralKebab}'`)) {
    console.log(`  [skip] client/src/layouts/AppLayout.tsx (nav already)`);
    return;
  }
  const navLine = `  { to: '/${pluralKebab}', label: '${Pascal}', icon: Box, permission: '${permissionKey}:read' },\n`;
  const marker = '// NAV_GENERATOR_MARKER';
  if (!content.includes(marker)) {
    console.log(`  [warn] client/src/layouts/AppLayout.tsx missing ${marker}, adding manually:`);
    console.log(`         ${navLine.trim()}`);
    console.log(`         (also import "Box" from "lucide-react")`);
    return;
  }
  const patched = content.replace(marker, navLine + '  ' + marker);
  await fs.writeFile(file, patched, 'utf8');
  console.log(`  [patch] client/src/layouts/AppLayout.tsx (+ nav ${kebab})`);
  console.log(`  [note ] icon defaulted to Box. Edit AppLayout.tsx to swap (e.g. Package, Receipt).`);
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const tier = isLayered ? 'LAYERED' : 'SIMPLE';
  console.log(`[generator] ${tier} module: ${kebab} (${Pascal})`);
  console.log();

  for (const [rel, content] of Object.entries(files)) {
    await writeFile(rel, content);
  }
  await patchSharedIndex();
  await patchServerRoutes();
  await patchClientApp();
  await patchClientNav();

  console.log(`
[generator] done (${tier}). Next steps (MANUAL):

  1. Add Prisma model to server/prisma/schema.prisma:

     model ${Pascal} {
       id        String   @id @default(cuid())
       name      String
       createdAt DateTime @default(now()) @map("created_at")
       updatedAt DateTime @updatedAt       @map("updated_at")
       @@map("${pluralSnake}")
     }

  2. Run migration:
     pnpm --filter @arahtamu/server db:migrate:dev --name add-${kebab}

  3. Add permission keys to packages/shared/src/constants/index.ts (PERMISSIONS):

       ${Pascal.toUpperCase()}_READ:   '${permissionKey}:read',
       ${Pascal.toUpperCase()}_WRITE:  '${permissionKey}:write',
       ${Pascal.toUpperCase()}_DELETE: '${permissionKey}:delete',

  4. Re-seed:
     pnpm --filter @arahtamu/server db:seed

  5. Run tests:
     pnpm --filter @arahtamu/server test ${kebab}
${
  isLayered
    ? `
  Tip: This is a LAYERED module — business logic in service, data in repository.
  Add custom queries to ${kebab}.repository.ts.
`
    : `
  Tip: This is a SIMPLE module. Upgrade later with: pnpm new:module ${kebab} --layered
`
}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
