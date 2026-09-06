import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { createPreregistrationSchema } from '@fdm/shared';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormDialog, type CrudField } from '@/components/crud/FormDialog';
import { useResource } from '@/hooks/use-resource';

interface PreregRow {
  id: string;
  status: string;
  scheduledAt: string;
  purpose: string | null;
  qrToken: string;
  visitorData?: { fullName?: string } | null;
  host?: { name: string } | null;
  location?: { name: string } | null;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Menunggu',
  USED: 'Terpakai',
  EXPIRED: 'Kedaluwarsa',
  CANCELLED: 'Dibatalkan',
};

export function PreregistrationPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['preregistration'],
    queryFn: async (): Promise<PreregRow[]> =>
      (await api.get<{ data: PreregRow[] }>('/preregistrations', { params: { limit: 100 } })).data.data,
  });
  const { data: hosts } = useQuery({
    queryKey: ['host'],
    queryFn: async () =>
      (await api.get<{ data: { id: string; name: string }[] }>('/hosts', { params: { limit: 200 } })).data.data,
  });
  const { data: locations } = useQuery({
    queryKey: ['location'],
    queryFn: async () =>
      (await api.get<{ data: { id: string; name: string }[] }>('/locations', { params: { limit: 100 } })).data
        .data,
  });
  const { create, remove } = useResource('preregistrations', 'preregistration');

  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<PreregRow | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);

  const fields: CrudField[] = [
    { name: 'visitor.fullName', label: 'Nama Tamu' },
    { name: 'visitor.company', label: 'Instansi', placeholder: 'Opsional' },
    { name: 'visitor.phone', label: 'No. HP' },
    { name: 'visitor.email', label: 'Email', placeholder: 'Opsional' },
    { name: 'hostId', label: 'Host', type: 'select', options: (hosts ?? []).map((h) => ({ value: h.id, label: h.name })) },
    {
      name: 'locationId',
      label: 'Lokasi',
      type: 'select',
      options: (locations ?? []).map((l) => ({ value: l.id, label: l.name })),
    },
    { name: 'scheduledAt', label: 'Jadwal Kunjungan', type: 'datetime' },
    { name: 'purpose', label: 'Keperluan', placeholder: 'Opsional' },
  ];

  const submit = (values: Record<string, unknown>) => {
    create.mutate(values, {
      onSuccess: (res) => {
        setFormOpen(false);
        const token = (res as { data: { data: { qrToken: string } } }).data.data.qrToken;
        setQrToken(token);
      },
    });
  };

  const copyToken = () => {
    if (qrToken) {
      void navigator.clipboard?.writeText(qrToken);
      toast.success('Token disalin');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pra-registrasi"
        action={
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> Undang Tamu
          </Button>
        }
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tamu</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead>Jadwal</TableHead>
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
                  <EmptyState title="Belum ada pra-registrasi" />
                </TableCell>
              </TableRow>
            )}
            {data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.visitorData?.fullName ?? '-'}</TableCell>
                <TableCell>{row.host?.name ?? '-'}</TableCell>
                <TableCell>{row.location?.name ?? '-'}</TableCell>
                <TableCell>{new Date(row.scheduledAt).toLocaleString('id-ID')}</TableCell>
                <TableCell>
                  <Badge variant={row.status === 'PENDING' ? 'default' : 'secondary'}>
                    {STATUS_LABEL[row.status] ?? row.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Lihat token QR"
                    onClick={() => setQrToken(row.qrToken)}
                  >
                    <Copy className="h-4 w-4" />
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
        title="Undang Tamu (Pra-registrasi)"
        fields={fields}
        schema={createPreregistrationSchema}
        defaultValues={{
          visitor: { fullName: '', company: '', phone: '', email: '' },
          hostId: undefined,
          locationId: undefined,
          scheduledAt: '',
          purpose: '',
        }}
        submitting={create.isPending}
        onSubmit={submit}
      />

      <Dialog open={!!qrToken} onOpenChange={(o) => !o && setQrToken(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Token QR Undangan</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Kirim token ini ke tamu. Saat datang, tamu scan QR di kiosk untuk check-in instan.
          </p>
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3">
            <code className="flex-1 break-all text-sm">{qrToken}</code>
            <Button size="icon" variant="ghost" onClick={copyToken}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Hapus pra-registrasi?"
        description={`Undangan untuk "${deleting?.visitorData?.fullName ?? 'tamu'}" akan dihapus.`}
        confirmLabel="Hapus"
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}
