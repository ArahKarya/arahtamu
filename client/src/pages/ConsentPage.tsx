import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { createConsentSchema } from '@arahtamu/shared';
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

interface ConsentRow {
  id: string;
  type: string;
  title: string;
  version: string;
  contentMd: string;
  active: boolean;
}

const TYPE_LABEL: Record<string, string> = { NDA: 'NDA', TATA_TERTIB: 'Tata Tertib', PDP: 'UU PDP' };

const FIELDS: CrudField[] = [
  {
    name: 'type',
    label: 'Jenis',
    type: 'select',
    options: [
      { value: 'NDA', label: 'NDA' },
      { value: 'TATA_TERTIB', label: 'Tata Tertib' },
      { value: 'PDP', label: 'UU PDP' },
    ],
  },
  { name: 'title', label: 'Judul' },
  { name: 'version', label: 'Versi', placeholder: 'mis. 1.0' },
  { name: 'contentMd', label: 'Isi (Markdown)', type: 'textarea' },
  { name: 'active', label: 'Aktif', type: 'checkbox' },
];

export function ConsentPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['consent'],
    queryFn: async (): Promise<ConsentRow[]> =>
      (await api.get<{ data: ConsentRow[] }>('/consents', { params: { limit: 100 } })).data.data,
  });
  const { create, update, remove } = useResource('consents', 'consent');

  const [editing, setEditing] = useState<ConsentRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<ConsentRow | null>(null);

  const submit = (values: Record<string, unknown>) => {
    const done = () => setFormOpen(false);
    if (editing) update.mutate({ id: editing.id, data: values }, { onSuccess: done });
    else create.mutate(values, { onSuccess: done });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dokumen Consent"
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
              <TableHead>Judul</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Versi</TableHead>
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
                  <EmptyState title="Belum ada dokumen consent" />
                </TableCell>
              </TableRow>
            )}
            {data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.title}</TableCell>
                <TableCell>{TYPE_LABEL[row.type] ?? row.type}</TableCell>
                <TableCell>{row.version}</TableCell>
                <TableCell>
                  <Badge variant={row.active ? 'default' : 'secondary'}>
                    {row.active ? 'Aktif' : 'Nonaktif'}
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
        title={editing ? 'Edit Dokumen Consent' : 'Tambah Dokumen Consent'}
        fields={FIELDS}
        schema={createConsentSchema}
        defaultValues={{
          type: editing?.type ?? 'PDP',
          title: editing?.title ?? '',
          version: editing?.version ?? '1.0',
          contentMd: editing?.contentMd ?? '',
          active: editing?.active ?? true,
        }}
        submitting={create.isPending || update.isPending}
        onSubmit={submit}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Hapus dokumen consent?"
        description={`"${deleting?.title}" akan dihapus.`}
        confirmLabel="Hapus"
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}
