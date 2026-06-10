import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface VisitRow {
  id: string;
  status: string;
  purpose: string | null;
  checkInAt: string | null;
  visitor?: { fullName: string } | null;
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

export function VisitPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['visit'],
    queryFn: async (): Promise<VisitRow[]> => {
      const res = await api.get<{ data: VisitRow[] }>('/visits', {
        params: { page: 1, limit: 50 },
      });
      return res.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Kunjungan" />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tamu</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead>Keperluan</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-28" /></TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && (!data || data.length === 0) && (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState title="Belum ada kunjungan" />
                </TableCell>
              </TableRow>
            )}
            {data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.visitor?.fullName ?? '-'}</TableCell>
                <TableCell>{row.host?.name ?? '-'}</TableCell>
                <TableCell>{row.location?.name ?? '-'}</TableCell>
                <TableCell>{row.purpose ?? '-'}</TableCell>
                <TableCell>
                  <Badge variant={row.status === 'CHECKED_IN' ? 'default' : 'secondary'}>
                    {STATUS_LABEL[row.status] ?? row.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
