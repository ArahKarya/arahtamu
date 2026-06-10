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

interface ConsentRow {
  id: string;
  type: string;
  title: string;
  version: string;
  active: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  NDA: 'NDA',
  TATA_TERTIB: 'Tata Tertib',
  PDP: 'UU PDP',
};

export function ConsentPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['consent'],
    queryFn: async (): Promise<ConsentRow[]> => {
      const res = await api.get<{ data: ConsentRow[] }>('/consents', {
        params: { page: 1, limit: 50 },
      });
      return res.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dokumen Consent"
        action={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Tambah
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
                  <Button variant="ghost" size="sm">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
