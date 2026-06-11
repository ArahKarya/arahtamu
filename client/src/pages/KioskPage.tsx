import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Camera, RefreshCw, Eraser, CheckCircle2, Printer } from 'lucide-react';
import { VisitorBadge, printBadge, type BadgeVisit } from '@/components/shared/visitor-badge';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Option {
  id: string;
  name: string;
}
interface ConsentDoc {
  id: string;
  type: string;
  title: string;
  version: string;
}

type Step = 'form' | 'photo' | 'sign' | 'consent' | 'done';

async function uploadBlob(blob: Blob, filename: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', blob, filename);
  const res = await api.post<{ data: { id: string } }>('/uploads', fd);
  return `/api/uploads/${res.data.data.id}/download`;
}

export function KioskPage() {
  const [step, setStep] = useState<Step>('form');
  const [locationId, setLocationId] = useState('');
  const [hostId, setHostId] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [badge, setBadge] = useState<BadgeVisit | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sigRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const { data: locations } = useQuery({
    queryKey: ['kiosk-locations'],
    queryFn: async () => (await api.get<{ data: Option[] }>('/locations', { params: { limit: 100 } })).data.data,
  });
  const { data: hosts } = useQuery({
    queryKey: ['kiosk-hosts'],
    queryFn: async () => (await api.get<{ data: Option[] }>('/hosts', { params: { limit: 200 } })).data.data,
  });
  const { data: consents } = useQuery({
    queryKey: ['kiosk-consents'],
    queryFn: async () => (await api.get<{ data: ConsentDoc[] }>('/consents/active')).data.data,
  });

  // Webcam lifecycle saat di langkah foto
  useEffect(() => {
    if (step !== 'photo') return;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => toast.error('Tidak bisa mengakses kamera'));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [step]);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 360;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhotoData(canvas.toDataURL('image/jpeg', 0.85));
  };

  // Signature pad
  const sigPos = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const c = sigRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };
  const startDraw = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const ctx = sigRef.current!.getContext('2d')!;
    const { x, y } = sigPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const moveDraw = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = sigRef.current!.getContext('2d')!;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111';
    const { x, y } = sigPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const clearSig = () => {
    const c = sigRef.current;
    if (c) c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
  };

  const canSubmitForm = locationId && hostId && fullName.trim() && phone.trim();

  const reset = () => {
    setStep('form');
    setLocationId('');
    setHostId('');
    setFullName('');
    setCompany('');
    setPhone('');
    setPurpose('');
    setPhotoData(null);
    setAccepted(false);
    setBadge(null);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      let photoUrl: string | undefined;
      let signatureUrl: string | undefined;

      if (photoData) {
        const blob = await (await fetch(photoData)).blob();
        photoUrl = await uploadBlob(blob, 'foto-tamu.jpg');
      }
      const sigBlob = await new Promise<Blob | null>((resolve) =>
        sigRef.current?.toBlob((b) => resolve(b), 'image/png'),
      );
      if (sigBlob) signatureUrl = await uploadBlob(sigBlob, 'ttd-tamu.png');

      const res = await api.post<{ data: BadgeVisit }>('/visits/check-in', {
        visitor: { fullName, company: company || undefined, phone },
        hostId,
        locationId,
        purpose: purpose || undefined,
        photoUrl,
        signatureUrl,
        consentAccepted: accepted,
      });
      setBadge(res.data.data);
      setStep('done');
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
        ?.message;
      toast.error(msg ?? 'Gagal check-in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold">Selamat Datang</h1>
        <p className="text-sm text-muted-foreground">Silakan check-in mandiri</p>
      </div>

      {step === 'form' && (
        <Card className="space-y-3 p-5">
          <div className="space-y-1.5">
            <Label>Lokasi</Label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            >
              <option value="">— Pilih lokasi —</option>
              {locations?.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Bertemu (Host)</Label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={hostId}
              onChange={(e) => setHostId(e.target.value)}
            >
              <option value="">— Pilih host —</option>
              {hosts?.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Nama Lengkap</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama Anda" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Instansi</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Opsional" />
            </div>
            <div className="space-y-1.5">
              <Label>No. HP</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xx" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Keperluan</Label>
            <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Opsional" />
          </div>
          <Button className="w-full" disabled={!canSubmitForm} onClick={() => setStep('photo')}>
            Lanjut
          </Button>
        </Card>
      )}

      {step === 'photo' && (
        <Card className="space-y-3 p-5">
          <Label>Foto Tamu</Label>
          {photoData ? (
            <img src={photoData} alt="Foto" className="mx-auto rounded-md" />
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="mx-auto w-full rounded-md bg-black" />
          )}
          <div className="flex gap-2">
            {photoData ? (
              <Button variant="outline" className="flex-1" onClick={() => setPhotoData(null)}>
                <RefreshCw className="h-4 w-4" /> Ulangi
              </Button>
            ) : (
              <Button className="flex-1" onClick={capturePhoto}>
                <Camera className="h-4 w-4" /> Ambil Foto
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setStep('form')}>Kembali</Button>
            <Button className="flex-1" onClick={() => setStep('sign')}>Lanjut</Button>
          </div>
        </Card>
      )}

      {step === 'sign' && (
        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <Label>Tanda Tangan</Label>
            <Button variant="ghost" size="sm" onClick={clearSig}>
              <Eraser className="h-4 w-4" /> Hapus
            </Button>
          </div>
          <canvas
            ref={sigRef}
            width={520}
            height={200}
            className="w-full touch-none rounded-md border bg-white"
            onPointerDown={startDraw}
            onPointerMove={moveDraw}
            onPointerUp={() => (drawing.current = false)}
            onPointerLeave={() => (drawing.current = false)}
          />
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setStep('photo')}>Kembali</Button>
            <Button className="flex-1" onClick={() => setStep('consent')}>Lanjut</Button>
          </div>
        </Card>
      )}

      {step === 'consent' && (
        <Card className="space-y-4 p-5">
          <Label>Persetujuan</Label>
          <div className="max-h-48 space-y-2 overflow-auto rounded-md border p-3 text-sm">
            {consents && consents.length > 0 ? (
              consents.map((c) => (
                <p key={c.id}>
                  <span className="font-medium">{c.title}</span> (v{c.version})
                </p>
              ))
            ) : (
              <p className="text-muted-foreground">Tidak ada dokumen persetujuan.</p>
            )}
          </div>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} />
            <span>Saya menyetujui tata tertib & pemrosesan data pribadi saya (UU PDP).</span>
          </label>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setStep('sign')}>Kembali</Button>
            <Button className="flex-1" disabled={!accepted || submitting} onClick={submit}>
              {submitting ? 'Memproses…' : 'Check-in'}
            </Button>
          </div>
        </Card>
      )}

      {step === 'done' && badge && (
        <Card className="space-y-4 p-6 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
          <h2 className="text-xl font-semibold">Check-in berhasil</h2>
          <p className="text-muted-foreground">Selamat datang, {badge.visitor?.fullName}!</p>

          <VisitorBadge visit={badge} />

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={printBadge}>
              <Printer className="h-4 w-4" /> Cetak Badge
            </Button>
            <Button className="flex-1" onClick={reset}>Tamu Berikutnya</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
