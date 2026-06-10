import { Users, Activity, FileText, Briefcase } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: typeof Users;
  iconColor: string;
}

function StatCard({ label, value, icon: Icon, iconColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconColor}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="font-heading text-2xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <div>
        <h1>Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Halo, {user?.name} — selamat bekerja.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value="—" icon={Users} iconColor="bg-info/10 text-info" />
        <StatCard
          label="Active Sessions"
          value="—"
          icon={Activity}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          label="Audit Events Today"
          value="—"
          icon={FileText}
          iconColor="bg-warning/10 text-warning"
        />
        <StatCard
          label="Jobs Running"
          value="—"
          icon={Briefcase}
          iconColor="bg-primary/10 text-primary"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li>
              Bangun modul bisnis dengan generator:{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                pnpm new:module &lt;nama&gt;
              </code>
            </li>
            <li>
              Akses Bull Board admin di{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/admin/queues</code>{' '}
              (admin only)
            </li>
            <li>
              Kelola user &amp; role di menu <strong>Users</strong>
            </li>
            <li>
              Cek aktivitas sistem di <strong>Audit Log</strong>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
