import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput, BRANDING } from '@fdm/shared';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

interface LoginResponse {
  user: { id: string; email: string; name: string; roles: string[]; permissions: string[] };
  tokens: { accessToken: string; refreshToken: string; expiresIn: number };
}

interface LocationState {
  from?: { pathname?: string };
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    return response?.data?.error?.message ?? 'Login gagal';
  }
  return 'Login gagal';
}

const INPUT_CLASS =
  'w-full rounded-md border border-input bg-background py-2.5 pl-10 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 aria-[invalid=true]:border-destructive';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const existingUser = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (existingUser) {
      const state = location.state as LocationState | null;
      navigate(state?.from?.pathname ?? '/dashboard', { replace: true });
    }
  }, [existingUser, location.state, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (input: LoginInput): Promise<void> => {
    setLoading(true);
    setApiError('');
    try {
      const res = await api.post<{ data: LoginResponse }>('/auth/login', input);
      const { user, tokens } = res.data.data;
      setAuth(user, tokens);
      const state = location.state as LocationState | null;
      navigate(state?.from?.pathname ?? '/dashboard', { replace: true });
      toast.success(`Selamat datang, ${user.name}`);
    } catch (err: unknown) {
      setApiError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-stretch bg-background">
      {/* ── Panel brand kiri (≥lg) ─────────────────────────────────────── */}
      <aside
        className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex lg:w-[46%] xl:w-[42%]"
        style={{
          backgroundColor: '#1d4e89',
          backgroundImage:
            'linear-gradient(135deg, #1b3a63 0%, #1d4e89 55%, #2563ab 100%)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 22% 18%, rgba(255,255,255,0.10), transparent 60%), radial-gradient(circle at 85% 92%, rgba(255,255,255,0.06), transparent 55%)',
          }}
        />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/20">
            <img src={BRANDING.LOGO_DARK} alt={BRANDING.APP_NAME} className="h-7 w-7 object-contain" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/60">Buku Tamu Digital</div>
            <div className="text-sm font-medium text-white/90">{BRANDING.APP_NAME}</div>
          </div>
        </div>

        <div className="relative">
          <div className="mb-4 text-[11px] uppercase tracking-[0.22em] text-white/60">
            Visitor Management System
          </div>
          <h2 className="text-[34px] font-semibold leading-[1.15] tracking-tight">
            Resepsionis tanpa antre.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70">
            Tamu check-in mandiri lewat QR, foto &amp; tanda tangan digital, host langsung
            mendapat notifikasi, dan setiap kunjungan terekam rapi — patuh UU PDP.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-6 text-xs text-white/60">
          <div>
            <div className="text-2xl font-semibold tabular-nums text-white/90">&lt; 60s</div>
            <div className="mt-1 uppercase tracking-wider">Check-in</div>
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-white/90">100%</div>
            <div className="mt-1 uppercase tracking-wider">Terdigitalisasi</div>
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-white/90">UU PDP</div>
            <div className="mt-1 uppercase tracking-wider">Patuh</div>
          </div>
        </div>
      </aside>

      {/* ── Form kanan ─────────────────────────────────────────────────── */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          {/* Brand mobile (<lg) */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <img
                src={BRANDING.LOGO_LIGHT}
                alt={BRANDING.APP_NAME}
                className="h-7 w-7 object-contain dark:hidden"
              />
              <img
                src={BRANDING.LOGO_DARK}
                alt={BRANDING.APP_NAME}
                className="hidden h-7 w-7 object-contain dark:block"
              />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Buku Tamu Digital
              </div>
              <div className="text-sm font-medium">{BRANDING.APP_NAME}</div>
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Masuk</div>
            <h1 className="text-2xl font-semibold tracking-tight">Selamat datang kembali</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Masuk ke akun {BRANDING.APP_NAME} Anda untuk melanjutkan.
            </p>
          </div>

          {apiError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-[13px] text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span className="leading-snug">{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="admin@fdm.local"
                  aria-invalid={!!errors.email}
                  className={INPUT_CLASS}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  className={INPUT_CLASS}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  tabIndex={-1}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Memproses…' : 'Masuk'}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-between border-t pt-6 text-[11px] text-muted-foreground">
            <span>
              Lupa password?{' '}
              <span className="font-medium text-foreground">Hubungi Administrator</span>
            </span>
            <span>{BRANDING.COPYRIGHT}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
