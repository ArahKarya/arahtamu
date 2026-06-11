import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { User, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/stores/auth';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { AuthImage } from '@/components/shared/auth-image';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface VisitRow {
  id: string;
  status: string;
  hostConfirmation: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  hostNote: string | null;
  purpose: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
  photoUrl: string | null;
  signatureUrl: string | null;
  visitor?: { fullName: string; company: string | null; phone: string } | null;
  host?: { name: string } | null;
  location?: { name: string } | null;
}

const STATUS_LABEL: Record<string, string> = {
  PREREGISTERED: 'Pra-registrasi',
  CHECKED_IN: 'Di dalam',
  CHECKED_OUT: 'Selesai',
  DENIED: 'Ditolak',
  NO_SHOW: 'Tidak hadir',
};

const CONFIRM_LABEL: Record<string, string> = {
  PENDING: 'Menunggu host',
  ACCEPTED: 'Diterima host',
  REJECTED: 'Ditolak host',
};
const CONFIRM_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  PENDING: 'secondary',
  ACCEPTED: 'default',
  REJECTED: 'destructive',
};

export function VisitPage() {
  const qc = useQueryClient();
  const canConfirm = useAuthStore((s) => s.hasPermission('visit:confirm'));
  const [detail, setDetail] = useState<VisitRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['visit'],
    queryFn: async (): Promise<VisitRow[]> => {
      const res = await api.get<{ data: VisitRow[] }>('/visits', { params: { page: 1, limit: 50 } });
      return res.data.data;
    },
  });

  const confirm = useMutation({
    mutationFn: ({ id, decision, note }: { id: string; decision: 'ACCEPT' | 'REJECT'; note?: string }) =>
      api.post(`/visits/${id}/confirm`, { decision, note }),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['visit'] });
      qc.invalidateQueries({ queryKey: ['visits-active'] });
      toast.success(vars.decision === 'ACCEPT' ? 'Kedatangan diterima' : 'Kedatangan ditolak');
      setDetail(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Gagal konfirmasi')),
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Kunjungan" />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Foto</TableHead>
              <TableHead>Tamu</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Konfirmasi</TableHead>
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
                  <EmptyState title="Belum ada kunjungan" />
                </TableCell>
              </TableRow>
            )}
            {data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <AuthImage
                    src={row.photoUrl}
                    alt={row.visitor?.fullName}
                    className="h-9 w-9 rounded-full object-cover bg-muted"
                    fallback={
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    }
                  />
                </TableCell>
                <TableCell className="font-medium">{row.visitor?.fullName ?? '-'}</TableCell>
                <TableCell>{row.host?.name ?? '-'}</TableCell>
                <TableCell>
                  <Badge variant={row.status === 'CHECKED_IN' ? 'default' : 'secondary'}>
                    {STATUS_LABEL[row.status] ?? row.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={CONFIRM_VARIANT[row.hostConfirmation] ?? 'secondary'}>
                    {CONFIRM_LABEL[row.hostConfirmation] ?? row.hostConfirmation}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setDetail(row)}>
                    Detail
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Kunjungan</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <AuthImage
                  src={detail.photoUrl}
                  alt={detail.visitor?.fullName}
                  className="h-24 w-24 rounded-md object-cover bg-muted"
                  fallback={
                    <div className="flex h-24 w-24 items-center justify-center rounded-md bg-muted">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  }
                />
                <div className="space-y-1">
                  <p className="font-medium">{detail.visitor?.fullName}</p>
                  <p className="text-muted-foreground">{detail.visitor?.company ?? '-'}</p>
                  <p className="text-muted-foreground">{detail.visitor?.phone}</p>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <Badge variant={detail.status === 'CHECKED_IN' ? 'default' : 'secondary'}>
                      {STATUS_LABEL[detail.status] ?? detail.status}
                    </Badge>
                    <Badge variant={CONFIRM_VARIANT[detail.hostConfirmation] ?? 'secondary'}>
                      {CONFIRM_LABEL[detail.hostConfirmation] ?? detail.hostConfirmation}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Host:</span> {detail.host?.name ?? '-'}</div>
                <div><span className="text-muted-foreground">Lokasi:</span> {detail.location?.name ?? '-'}</div>
                <div><span className="text-muted-foreground">Keperluan:</span> {detail.purpose ?? '-'}</div>
                <div>
                  <span className="text-muted-foreground">Check-in:</span>{' '}
                  {detail.checkInAt ? new Date(detail.checkInAt).toLocaleString('id-ID') : '-'}
                </div>
              </div>

              {detail.hostNote && (
                <p className="rounded-md bg-muted/50 p-2 text-xs">
                  <span className="text-muted-foreground">Catatan host:</span> {detail.hostNote}
                </p>
              )}

              {/* Konfirmasi host (terima/tolak) */}
              {canConfirm && detail.status === 'CHECKED_IN' && detail.hostConfirmation === 'PENDING' && (
                <div className="flex gap-2 border-t pt-3">
                  <Button
                    className="flex-1"
                    disabled={confirm.isPending}
                    onClick={() => confirm.mutate({ id: detail.id, decision: 'ACCEPT' })}
                  >
                    <Check className="h-4 w-4" /> Terima
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={confirm.isPending}
                    onClick={() => {
                      const note = window.prompt('Alasan menolak (opsional):') ?? undefined;
                      confirm.mutate({ id: detail.id, decision: 'REJECT', note: note || undefined });
                    }}
                  >
                    <X className="h-4 w-4" /> Tolak
                  </Button>
                </div>
              )}

              <div>
                <p className="mb-1 text-xs text-muted-foreground">Tanda tangan</p>
                <AuthImage
                  src={detail.signatureUrl}
                  alt="Tanda tangan"
                  className="h-24 w-full rounded-md border bg-white object-contain"
                  fallback={
                    <div className="flex h-24 w-full items-center justify-center rounded-md border text-xs text-muted-foreground">
                      Tidak ada tanda tangan
                    </div>
                  }
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
