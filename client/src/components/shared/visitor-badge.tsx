import { QRCodeSVG } from 'qrcode.react';
import { User } from 'lucide-react';
import { BRANDING } from '@fdm/shared';
import { AuthImage } from '@/components/shared/auth-image';

export interface BadgeVisit {
  badgeCode: string | null;
  photoUrl: string | null;
  checkInAt: string | null;
  visitor?: { fullName: string; company: string | null } | null;
  host?: { name: string } | null;
  location?: { name: string } | null;
}

/** Memicu cetak hanya kartu badge (lihat .printing-badge di styles/index.css). */
export function printBadge() {
  document.body.classList.add('printing-badge');
  const cleanup = () => {
    document.body.classList.remove('printing-badge');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  // beri waktu render/foto sebelum dialog cetak muncul
  setTimeout(() => window.print(), 50);
}

/** Kartu badge tamu (cetak ~80mm). Render boleh off-screen — saat cetak diisolasi via CSS. */
export function VisitorBadge({ visit }: { visit: BadgeVisit }) {
  const checkIn = visit.checkInAt
    ? new Date(visit.checkInAt).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

  return (
    <div className="badge-print mx-auto w-[300px] rounded-xl border bg-white p-5 text-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
        <span className="text-sm font-semibold">{BRANDING.APP_NAME}</span>
        <span className="rounded bg-neutral-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          Tamu
        </span>
      </div>

      <div className="mt-4 flex flex-col items-center text-center">
        <AuthImage
          src={visit.photoUrl}
          alt={visit.visitor?.fullName}
          className="h-24 w-24 rounded-lg border border-neutral-200 object-cover"
          fallback={
            <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-neutral-100">
              <User className="h-10 w-10 text-neutral-400" />
            </div>
          }
        />
        <p className="mt-3 text-lg font-bold leading-tight">{visit.visitor?.fullName ?? '-'}</p>
        {visit.visitor?.company && (
          <p className="text-sm text-neutral-500">{visit.visitor.company}</p>
        )}
      </div>

      <div className="mt-3 space-y-1 text-xs text-neutral-600">
        <div className="flex justify-between gap-2">
          <span>Bertemu</span>
          <span className="font-medium text-neutral-900">{visit.host?.name ?? '-'}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Lokasi</span>
          <span className="font-medium text-neutral-900">{visit.location?.name ?? '-'}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Check-in</span>
          <span className="font-medium text-neutral-900">{checkIn}</span>
        </div>
      </div>

      {visit.badgeCode && (
        <div className="mt-4 flex flex-col items-center border-t border-neutral-200 pt-3">
          <QRCodeSVG value={visit.badgeCode} size={104} level="M" />
          <p className="mt-1 break-all font-mono text-[8px] text-neutral-400">{visit.badgeCode}</p>
        </div>
      )}

      <p className="mt-3 text-center text-[9px] text-neutral-400">{BRANDING.COPYRIGHT}</p>
    </div>
  );
}
