import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  LogIn,
  Users,
  Contact,
  UserX,
  ScanLine,
  CalendarClock,
  ShieldAlert,
  BarChart3,
  ArrowRight,
  User as UserIcon,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { AuthImage } from '@/components/shared/auth-image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Summary {
  activeNow: number;
  checkInsToday: number;
  noShow: number;
  totalVisitors: number;
}
interface ActiveVisit {
  id: string;
  checkInAt: string | null;
  photoUrl: string | null;
  visitor?: { fullName: string; company: string | null } | null;
  host?: { name: string } | null;
  location?: { name: string } | null;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

const STATS = [
  { key: 'activeNow', label: 'Tamu di gedung', icon: LogIn, cls: 'bg-primary/10 text-primary' },
  { key: 'checkInsToday', label: 'Check-in hari ini', icon: Users, cls: 'bg-emerald-500/10 text-emerald-600' },
  { key: 'totalVisitors', label: 'Total tamu', icon: Contact, cls: 'bg-sky-500/10 text-sky-600' },
  { key: 'noShow', label: 'No-show', icon: UserX, cls: 'bg-amber-500/10 text-amber-600' },
] as const;

const QUICK_ACTIONS = [
  { to: '/kiosk', label: 'Kiosk Check-in', desc: 'Buka layar self check-in', icon: ScanLine, perm: 'visit:write' },
  { to: '/preregistrations', label: 'Undang Tamu', desc: 'Buat pra-registrasi + QR', icon: CalendarClock, perm: 'preregistration:read' },
  { to: '/watchlists', label: 'Watchlist', desc: 'Kelola daftar pantau/blokir', icon: ShieldAlert, perm: 'watchlist:read' },
  { to: '/reports', label: 'Laporan', desc: 'Analitik & ekspor kunjungan', icon: BarChart3, perm: 'report:read' },
] as const;

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const navigate = useNavigate();

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: async (): Promise<Summary> => (await api.get<{ data: Summary }>('/reports/summary')).data.data,
  });
  const { data: active, isLoading: loadingActive } = useQuery({
    queryKey: ['visits-active'],
    queryFn: async (): Promise<ActiveVisit[]> =>
      (await api.get<{ data: ActiveVisit[] }>('/visits/active', { params: { limit: 8 } })).data.data,
    refetchInterval: 30000,
  });

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const actions = QUICK_ACTIONS.filter((a) => hasPermission(a.perm));

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#1b3a63] via-[#1d4e89] to-[#2563ab] p-6 text-white md:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background: 'radial-gradient(circle at 85% 20%, rgba(255,255,255,0.12), transparent 55%)',
          }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge className="mb-2 border-white/20 bg-white/15 text-white hover:bg-white/15">
              {user?.roles?.[0] ?? 'Pengguna'}
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {greeting()}, {user?.name?.split(' ')[0] ?? ''} 👋
            </h1>
            <p className="mt-1 text-sm text-white/70">{today}</p>
          </div>
          {hasPermission('visit:write') && (
            <button
              onClick={() => navigate('/kiosk')}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-[#1d4e89] shadow-sm transition-colors hover:bg-white/90"
            >
              <ScanLine className="h-4 w-4" /> Buka Kiosk
            </button>
          )}
        </div>
      </div>

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
                {loadingSummary ? (
                  <Skeleton className="mt-1 h-7 w-12" />
                ) : (
                  <p className="font-heading text-2xl font-semibold">{summary?.[s.key] ?? 0}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      {actions.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((a) => (
            <button
              key={a.to}
              onClick={() => navigate(a.to)}
              className="group w-full rounded-lg border bg-card p-4 text-left transition-all hover:border-primary/40 hover:bg-accent"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <a.icon className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-3 text-sm font-medium">{a.label}</p>
              <p className="text-xs text-muted-foreground">{a.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* Tamu sedang di dalam gedung */}
      <Card>
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div>
            <h2 className="font-heading text-sm font-semibold">Tamu di dalam gedung</h2>
            <p className="text-xs text-muted-foreground">Sedang check-in (otomatis refresh)</p>
          </div>
          <button
            onClick={() => navigate('/visits')}
            className="text-xs font-medium text-primary hover:underline"
          >
            Lihat semua
          </button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" />
              <TableHead>Tamu</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead className="text-right">Check-in</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingActive &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))}
            {!loadingActive && (!active || active.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  Tidak ada tamu di dalam gedung saat ini.
                </TableCell>
              </TableRow>
            )}
            {active?.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  <AuthImage
                    src={v.photoUrl}
                    alt={v.visitor?.fullName}
                    className="h-8 w-8 rounded-full object-cover bg-muted"
                    fallback={
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{v.visitor?.fullName ?? '-'}</div>
                  {v.visitor?.company && (
                    <div className="text-xs text-muted-foreground">{v.visitor.company}</div>
                  )}
                </TableCell>
                <TableCell>{v.host?.name ?? '-'}</TableCell>
                <TableCell>{v.location?.name ?? '-'}</TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {v.checkInAt
                    ? new Date(v.checkInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
