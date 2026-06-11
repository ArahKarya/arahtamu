import { useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';

interface AuthImageProps {
  /** Path seperti `/api/uploads/<id>/download` (butuh Bearer; img biasa tak kirim token). */
  src?: string | null;
  alt?: string;
  className?: string;
  fallback?: ReactNode;
}

/**
 * Menampilkan gambar dari endpoint yang dilindungi auth: fetch via axios (token
 * otomatis) → object URL. Mencegah masalah `<img src=/api/...>` yang tak mengirim Bearer.
 */
export function AuthImage({ src, alt, className, fallback = null }: AuthImageProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!src) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    const path = src.replace(/^\/api/, '');
    api
      .get(path, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data as Blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!src) return <>{fallback}</>;
  if (!url) return <div className={className} aria-busy="true" />;
  return <img src={url} alt={alt ?? ''} className={className} />;
}
