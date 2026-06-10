import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput, BRANDING } from '@arahtamu/shared';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const existingUser = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);

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
    try {
      const res = await api.post<{ data: LoginResponse }>('/auth/login', input);
      const { user, tokens } = res.data.data;
      setAuth(user, tokens);
      const state = location.state as LocationState | null;
      const from = state?.from?.pathname ?? '/dashboard';
      navigate(from, { replace: true });
      toast.success(`Selamat datang, ${user.name}`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="space-y-1 text-center pb-6">
          <img
            src={BRANDING.LOGO_LIGHT}
            alt={BRANDING.APP_NAME}
            className="mx-auto mb-1 h-14 w-14 dark:hidden"
          />
          <img
            src={BRANDING.LOGO_DARK}
            alt={BRANDING.APP_NAME}
            className="mx-auto mb-1 h-14 w-14 hidden dark:block"
          />
          <CardTitle className="text-xl">{BRANDING.APP_NAME}</CardTitle>
          <CardDescription>Masuk ke akun Anda</CardDescription>
          <p className="text-[10px] text-muted-foreground/60 pt-1">
            {BRANDING.COPYRIGHT}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@arahtamu.local"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
