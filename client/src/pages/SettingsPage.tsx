import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SettingRow {
  key: string;
  value: unknown;
  updatedAt: string;
}

export function SettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<SettingRow[]> => {
      const res = await api.get<{ data: SettingRow[] }>('/settings');
      return res.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1>Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Konfigurasi aplikasi</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>Key-value config yang tersimpan di database</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                  </TableRow>
                ))}
              {data?.map((s) => (
                <TableRow key={s.key}>
                  <TableCell className="font-mono text-xs">{s.key}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {JSON.stringify(s.value)}
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                    Belum ada setting.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
