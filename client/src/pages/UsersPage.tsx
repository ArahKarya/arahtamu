import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { createUserSchema, updateUserSchema } from '@fdm/shared';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { FormDialog, type CrudField } from '@/components/crud/FormDialog';
import { useResource } from '@/hooks/use-resource';

interface UserRow {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  roles: string[];
}
interface Role {
  id: string;
  name: string;
}

export function UsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<UserRow[]> =>
      (await api.get<{ data: UserRow[] }>('/users', { params: { limit: 100 } })).data.data,
  });
  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async (): Promise<Role[]> => (await api.get<{ data: Role[] }>('/roles')).data.data,
  });
  const { create, update, remove } = useResource('users', 'users');

  const [editing, setEditing] = useState<UserRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<UserRow | null>(null);

  const roleOptions = (roles ?? []).map((r) => ({ value: r.id, label: r.name }));
  const nameToId = new Map((roles ?? []).map((r) => [r.name, r.id]));

  const fields: CrudField[] = [
    { name: 'name', label: 'Nama' },
    { name: 'email', label: 'Email', placeholder: 'nama@perusahaan.com' },
    ...(editing ? [] : [{ name: 'password', label: 'Password', type: 'password' as const }]),
    { name: 'roleIds', label: 'Roles', type: 'multiselect', options: roleOptions },
    { name: 'isActive', label: 'Aktif', type: 'checkbox' },
  ];

  const submit = (values: Record<string, unknown>) => {
    const done = () => setFormOpen(false);
    if (editing) update.mutate({ id: editing.id, data: values }, { onSuccess: done });
    else create.mutate(values, { onSuccess: done });
  };

  const defaultValues = editing
    ? {
        name: editing.name,
        email: editing.email,
        roleIds: editing.roles.map((n) => nameToId.get(n)).filter(Boolean) as string[],
        isActive: editing.isActive,
      }
    : { name: '', email: '', password: '', roleIds: [], isActive: true };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        action={
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" /> Tambah User
          </Button>
        }
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                  ))}
                </TableRow>
              ))}
            {data?.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map((r) => (
                      <Badge key={r} variant="secondary">{r}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={u.isActive ? 'success' : 'outline'}>
                    {u.isActive ? 'Aktif' : 'Non-aktif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(u); setFormOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleting(u)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Belum ada user.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? 'Edit User' : 'Tambah User'}
        fields={fields}
        schema={editing ? updateUserSchema : createUserSchema}
        defaultValues={defaultValues}
        submitting={create.isPending || update.isPending}
        onSubmit={submit}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Hapus user?"
        description={`User "${deleting?.name}" akan dihapus.`}
        confirmLabel="Hapus"
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}
