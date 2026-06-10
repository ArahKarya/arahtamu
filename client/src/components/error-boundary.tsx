import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sentry } from '@/lib/sentry';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    // Forward ke Sentry kalau VITE_SENTRY_DSN diset; no-op kalau tidak.
    Sentry.captureException(error, {
      contexts: { react: { componentStack: info.componentStack } },
    });
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info);
    }
  }

  reset = (): void => this.setState({ hasError: false, error: null });

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback && this.state.error) {
      return this.props.fallback(this.state.error, this.reset);
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold">Terjadi kesalahan</h1>
          <p className="text-sm text-muted-foreground">
            Aplikasi mengalami galat tak terduga. Silakan muat ulang halaman atau hubungi admin
            jika masalah berulang.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={this.reset}>
              Coba lagi
            </Button>
            <Button onClick={() => window.location.reload()}>Muat ulang</Button>
          </div>
        </div>
      </div>
    );
  }
}
