import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, Users, LogIn, UserX, Contact } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Summary {
  activeNow: number;
  checkInsToday: number;
  noShow: number;
  totalVisitors: number;
  byStatus: Record<string, number>;
}

const STATS = [
  { key: 'activeNow', label: 'Tamu di gedung', icon: LogIn, cls: 'bg-primary/10 text-primary' },
  { key: 'checkInsToday', label: 'Check-in hari ini', icon: Users, cls: 'bg-emerald-500/10 text-emerald-600' },
  { key: 'totalVisitors', label: 'Total tamu', icon: Contact, cls: 'bg-sky-500/10 text-sky-600' },
  { key: 'noShow', label: 'No-show', icon: UserX, cls: 'bg-amber-500/10 text-amber-600' },
] as const;

const STATUS_LABEL: Record<string, string> = {
  PREREGISTERED: 'Pra-registrasi',
  CHECKED_IN: 'Di dalam',
  CHECKED_OUT: 'Selesai',
  DENIED: 'Ditolak',
  NO_SHOW: 'Tidak hadir',
};
const STATUS_BAR: Record<string, string> = {
  CHECKED_IN: 'bg-primary',
  CHECKED_OUT: 'bg-emerald-500',
  PREREGISTERED: 'bg-sky-500',
  NO_SHOW: 'bg-amber-500',
  DENIED: 'bg-destructive',
};

export function ReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: async (): Promise<Summary> => (await api.get<{ data: Summary }>('/reports/summary')).data.data,
  });

  const handleExport = async (): Promise<void> => {
    setExporting(true);
    try {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = `${to}T23:59:59`; // inklusif sampai akhir hari
      const res = await api.get('/reports/export', { params, responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'laporan-kunjungan.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Laporan diunduh');
    } catch {
      toast.error('Gagal mengekspor');
    } finally {
      setExporting(false);
    }
  };

  const statuses = Object.entries(data?.byStatus ?? {});
  const total = statuses.reduce((sum, [, c]) => sum + c, 0);

  return (
    <div className="space-y-4">
      <PageHeader title="Laporan & Analitik" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.key}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', s.cls)}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                {isLoading ? (
                  <Skeleton className="mt-1 h-7 w-12" />
                ) : (
                  <p className="font-heading text-2xl font-semibold">{data?.[s.key] ?? 0}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Distribusi status */}
      <Card className="p-5">
        <h2 className="mb-4 font-heading text-sm font-semibold">Kunjungan per status</h2>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : statuses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada kunjungan.</p>
        ) : (
          <div className="space-y-3">
            {statuses
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{STATUS_LABEL[status] ?? status}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {count} ({total ? Math.round((count / total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full', STATUS_BAR[status] ?? 'bg-muted-foreground')}
                      style={{ width: `${total ? (count / total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Ekspor laporan */}
      <Card className="p-5">
        <h2 className="mb-1 font-heading text-sm font-semibold">Ekspor Laporan Kunjungan</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Unduh CSV (Excel-ready). Kosongkan tanggal untuk semua data.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="from">Dari tanggal</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to">Sampai tanggal</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
          </div>
          <Button onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4" />
            {exporting ? 'Menyiapkan…' : 'Ekspor CSV'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
