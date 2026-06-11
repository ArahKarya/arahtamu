import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Building2, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/stores/auth';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface SettingRow {
  key: string;
  value: unknown;
}

type FieldType = 'text' | 'textarea' | 'number';
interface Field {
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  hint?: string;
}
interface Section {
  title: string;
  desc: string;
  icon: typeof Building2;
  fields: Field[];
}

const SECTIONS: Section[] = [
  {
    title: 'Organisasi',
    desc: 'Identitas organisasi yang tampil di aplikasi & laporan.',
    icon: Building2,
    fields: [
      { key: 'company.name', label: 'Nama Organisasi', placeholder: 'PT Contoh Sejahtera' },
      { key: 'company.address', label: 'Alamat', type: 'textarea', placeholder: 'Alamat kantor' },
    ],
  },
  {
    title: 'Aplikasi',
    desc: 'Preferensi tampilan & lokal.',
    icon: SlidersHorizontal,
    fields: [
      { key: 'app.timezone', label: 'Zona Waktu', placeholder: 'Asia/Jakarta' },
      { key: 'app.locale', label: 'Bahasa / Locale', placeholder: 'id-ID' },
    ],
  },
  {
    title: 'Privasi & UU PDP',
    desc: 'Kebijakan retensi data tamu.',
    icon: ShieldCheck,
    fields: [
      {
        key: 'pdp.retentionDays',
        label: 'Masa Retensi (hari)',
        type: 'number',
        placeholder: '90',
        hint: 'Data kunjungan & foto/TTD tamu dihapus otomatis setelah N hari (kecuali daftar blokir). Default 90.',
      },
    ],
  },
];

const ALL_KEYS = SECTIONS.flatMap((s) => s.fields.map((f) => f.key));

export function SettingsPage() {
  const qc = useQueryClient();
  const canWrite = useAuthStore((s) => s.hasPermission('settings:write'));
  const [form, setForm] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<SettingRow[]> => (await api.get<{ data: SettingRow[] }>('/settings')).data.data,
  });

  useEffect(() => {
    if (!data) return;
    const map: Record<string, string> = {};
    for (const row of data) {
      if (ALL_KEYS.includes(row.key)) {
        map[row.key] = row.value == null ? '' : String(row.value);
      }
    }
    setForm(map);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      await Promise.all(
        ALL_KEYS.map((key) => {
          const raw = form[key] ?? '';
          const field = SECTIONS.flatMap((s) => s.fields).find((f) => f.key === key);
          const value = field?.type === 'number' ? (raw === '' ? null : Number(raw)) : raw;
          return api.put('/settings', { key, value });
        }),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Pengaturan tersimpan');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Gagal menyimpan')),
  });

  const setField = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pengaturan"
        action={
          canWrite ? (
            <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
              <Save className="h-4 w-4" />
              {save.isPending ? 'Menyimpan…' : 'Simpan'}
            </Button>
          ) : undefined
        }
      />

      {SECTIONS.map((section) => (
        <Card key={section.title} className="p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <section.icon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-heading text-sm font-semibold">{section.title}</h2>
              <p className="text-xs text-muted-foreground">{section.desc}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {section.fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={f.key}>{f.label}</Label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : f.type === 'textarea' ? (
                  <Textarea
                    id={f.key}
                    value={form[f.key] ?? ''}
                    placeholder={f.placeholder}
                    disabled={!canWrite}
                    onChange={(e) => setField(f.key, e.target.value)}
                  />
                ) : (
                  <Input
                    id={f.key}
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={form[f.key] ?? ''}
                    placeholder={f.placeholder}
                    disabled={!canWrite}
                    onChange={(e) => setField(f.key, e.target.value)}
                  />
                )}
                {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
              </div>
            ))}
          </div>
        </Card>
      ))}

      {!canWrite && (
        <p className="text-xs text-muted-foreground">
          Anda hanya dapat melihat pengaturan. Hubungi admin untuk mengubah.
        </p>
      )}
    </div>
  );
}
