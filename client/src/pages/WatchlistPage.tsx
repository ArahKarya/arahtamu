import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { createWatchlistSchema } from '@arahtamu/shared';
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

interface WatchlistRow {
  id: string;
  fullName: string;
  phone: string | null;
  idNumber: string | null;
  reason: string;
  level: 'WATCH' | 'BLOCK';
}

const FIELDS: CrudField[] = [
  { name: 'fullName', label: 'Nama' },
  { name: 'phone', label: 'No. HP', placeholder: 'Opsional' },
  { name: 'idNumber', label: 'No. Identitas', placeholder: 'Opsional' },
  { name: 'reason', label: 'Alasan', type: 'textarea' },
  {
    name: 'level',
    label: 'Level',
    type: 'select',
    options: [
      { value: 'WATCH', label: 'Pantau (WATCH)' },
      { value: 'BLOCK', label: 'Blokir (BLOCK)' },
    ],
  },
];

export function WatchlistPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async (): Promise<WatchlistRow[]> =>
      (await api.get<{ data: WatchlistRow[] }>('/watchlists', { params: { limit: 100 } })).data.data,
  });
  const { create, update, remove } = useResource('watchlists', 'watchlist');

  const [editing, setEditing] = useState<WatchlistRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<WatchlistRow | null>(null);

  const submit = (values: Record<string, unknown>) => {
    const done = () => setFormOpen(false);
    if (editing) update.mutate({ id: editing.id, data: values }, { onSuccess: done });
    else create.mutate(values, { onSuccess: done });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Watchlist"
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
              <TableHead>No. HP</TableHead>
              <TableHead>Alasan</TableHead>
              <TableHead>Level</TableHead>
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
                  <EmptyState title="Belum ada data watchlist" />
                </TableCell>
              </TableRow>
            )}
            {data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.fullName}</TableCell>
                <TableCell>{row.phone ?? '-'}</TableCell>
                <TableCell className="max-w-xs truncate">{row.reason}</TableCell>
                <TableCell>
                  <Badge variant={row.level === 'BLOCK' ? 'destructive' : 'secondary'}>
                    {row.level === 'BLOCK' ? 'Blokir' : 'Pantau'}
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
        title={editing ? 'Edit Watchlist' : 'Tambah Watchlist'}
        fields={FIELDS}
        schema={createWatchlistSchema}
        defaultValues={{
          fullName: editing?.fullName ?? '',
          phone: editing?.phone ?? '',
          idNumber: editing?.idNumber ?? '',
          reason: editing?.reason ?? '',
          level: editing?.level ?? 'WATCH',
        }}
        submitting={create.isPending || update.isPending}
        onSubmit={submit}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Hapus dari watchlist?"
        description={`"${deleting?.fullName}" akan dihapus dari watchlist.`}
        confirmLabel="Hapus"
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}
