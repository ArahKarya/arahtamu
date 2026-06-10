import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface LocationRow {
  id: string;
  name: string;
}

export function LocationPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['location'],
    queryFn: async (): Promise<LocationRow[]> => {
      const res = await api.get<{ data: LocationRow[] }>('/locations', {
        params: { page: 1, limit: 50 },
      });
      return res.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Location"
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
              <TableHead>Nama</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="ml-auto h-4 w-12" /></TableCell>
                </TableRow>
              ))}
            {!isLoading && (!data || data.length === 0) && (
              <TableRow>
                <TableCell colSpan={2}>
                  <EmptyState title="Belum ada data location" />
                </TableCell>
              </TableRow>
            )}
            {data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
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
