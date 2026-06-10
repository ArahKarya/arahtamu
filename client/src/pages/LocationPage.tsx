import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { createLocationSchema } from '@arahtamu/shared';
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

interface LocationRow {
  id: string;
  name: string;
  address: string | null;
  capacity: number | null;
  openHours: string | null;
  isActive: boolean;
}

const FIELDS: CrudField[] = [
  { name: 'name', label: 'Nama Lokasi', placeholder: 'mis. Kantor Pusat' },
  { name: 'address', label: 'Alamat', type: 'textarea', placeholder: 'Opsional' },
  { name: 'capacity', label: 'Kapasitas', type: 'number', placeholder: 'Opsional' },
  { name: 'openHours', label: 'Jam Operasional', placeholder: 'mis. 08:00-17:00' },
  { name: 'isActive', label: 'Aktif', type: 'checkbox' },
];

export function LocationPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['location'],
    queryFn: async (): Promise<LocationRow[]> =>
      (await api.get<{ data: LocationRow[] }>('/locations', { params: { limit: 100 } })).data.data,
  });
  const { create, update, remove } = useResource('locations', 'location');

  const [editing, setEditing] = useState<LocationRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<LocationRow | null>(null);

  const submit = (values: Record<string, unknown>) => {
    const done = () => setFormOpen(false);
    if (editing) update.mutate({ id: editing.id, data: values }, { onSuccess: done });
    else create.mutate(values, { onSuccess: done });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Lokasi"
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
              <TableHead>Alamat</TableHead>
              <TableHead>Kapasitas</TableHead>
              <TableHead>Jam</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && (!data || data.length === 0) && (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState title="Belum ada lokasi" />
                </TableCell>
              </TableRow>
            )}
            {data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-muted-foreground">{row.address ?? '-'}</TableCell>
                <TableCell>{row.capacity ?? '-'}</TableCell>
                <TableCell>{row.openHours ?? '-'}</TableCell>
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
        title={editing ? 'Edit Lokasi' : 'Tambah Lokasi'}
        fields={FIELDS}
        schema={createLocationSchema}
        defaultValues={{
          name: editing?.name ?? '',
          address: editing?.address ?? '',
          capacity: editing?.capacity ?? undefined,
          openHours: editing?.openHours ?? '',
          isActive: editing?.isActive ?? true,
        }}
        submitting={create.isPending || update.isPending}
        onSubmit={submit}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Hapus lokasi?"
        description={`Lokasi "${deleting?.name}" akan dihapus.`}
        confirmLabel="Hapus"
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}
