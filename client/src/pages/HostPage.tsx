import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { createHostSchema } from '@arahtamu/shared';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { FormDialog, type CrudField } from '@/components/crud/FormDialog';
import { useResource } from '@/hooks/use-resource';

interface HostRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  departmentId: string | null;
  isActive: boolean;
  department?: { name: string } | null;
}

export function HostPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['host'],
    queryFn: async (): Promise<HostRow[]> =>
      (await api.get<{ data: HostRow[] }>('/hosts', { params: { limit: 200 } })).data.data,
  });
  const { data: departments } = useQuery({
    queryKey: ['department'],
    queryFn: async () =>
      (await api.get<{ data: { id: string; name: string }[] }>('/departments', { params: { limit: 100 } })).data
        .data,
  });
  const { create, update, remove } = useResource('hosts', 'host');

  const [editing, setEditing] = useState<HostRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<HostRow | null>(null);

  const fields: CrudField[] = [
    { name: 'name', label: 'Nama Host' },
    { name: 'email', label: 'Email', placeholder: 'nama@perusahaan.com' },
    { name: 'phone', label: 'No. WhatsApp', placeholder: 'Opsional' },
    {
      name: 'departmentId',
      label: 'Departemen',
      type: 'select',
      options: (departments ?? []).map((d) => ({ value: d.id, label: d.name })),
    },
    { name: 'isActive', label: 'Aktif', type: 'checkbox' },
  ];

  const submit = (values: Record<string, unknown>) => {
    const done = () => setFormOpen(false);
    if (editing) update.mutate({ id: editing.id, data: values }, { onSuccess: done });
    else create.mutate(values, { onSuccess: done });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Host"
        action={
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" /> Tambah
          </Button>
        }
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Departemen</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && (!data || data.length === 0) && (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState title="Belum ada host" />
                </TableCell>
              </TableRow>
            )}
            {data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-muted-foreground">{row.email}</TableCell>
                <TableCell>{row.department?.name ?? '-'}</TableCell>
                <TableCell>
                  <Badge variant={row.isActive ? 'default' : 'secondary'}>
                    {row.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(row); setFormOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleting(row)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? 'Edit Host' : 'Tambah Host'}
        fields={fields}
        schema={createHostSchema}
        defaultValues={{
          name: editing?.name ?? '',
          email: editing?.email ?? '',
          phone: editing?.phone ?? '',
          departmentId: editing?.departmentId ?? undefined,
          isActive: editing?.isActive ?? true,
        }}
        submitting={create.isPending || update.isPending}
        onSubmit={submit}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Hapus host?"
        description={`Host "${deleting?.name}" akan dihapus.`}
        confirmLabel="Hapus"
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}
