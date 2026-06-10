import { useQuery } from '@tanstack/react-query';
import { Download, Users, LogIn, UserX, Contact } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface Summary {
  activeNow: number;
  checkInsToday: number;
  noShow: number;
  totalVisitors: number;
  byStatus: Record<string, number>;
}

const STATS = [
  { key: 'activeNow', label: 'Tamu di gedung', icon: LogIn },
  { key: 'checkInsToday', label: 'Check-in hari ini', icon: Users },
  { key: 'totalVisitors', label: 'Total tamu', icon: Contact },
  { key: 'noShow', label: 'No-show', icon: UserX },
] as const;

export function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: async (): Promise<Summary> => {
      const res = await api.get<{ data: Summary }>('/reports/summary');
      return res.data.data;
    },
  });

  const handleExport = async (): Promise<void> => {
    const res = await api.get('/reports/export', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'laporan-kunjungan.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Laporan & Analitik"
        action={
          <Button size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Ekspor CSV
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.key} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-16" />
            ) : (
              <p className="mt-2 text-3xl font-semibold">{data?.[s.key] ?? 0}</p>
            )}
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-medium">Kunjungan per status</h3>
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(data?.byStatus ?? {}).map(([status, count]) => (
              <div key={status} className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">{status}</p>
                <p className="text-xl font-semibold">{count}</p>
              </div>
            ))}
            {Object.keys(data?.byStatus ?? {}).length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada kunjungan.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
