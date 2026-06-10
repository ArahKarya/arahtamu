import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PreregistrationRow {
  id: string;
  status: string;
  scheduledAt: string;
  purpose: string | null;
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
    queryFn: async (): Promise<PreregistrationRow[]> => {
      const res = await api.get<{ data: PreregistrationRow[] }>('/preregistrations', {
        params: { page: 1, limit: 50 },
      });
      return res.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pra-registrasi"
        action={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Undang Tamu
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
