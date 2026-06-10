/**
 * Minimal HTML email templates. Keep simple — inline CSS, no external assets,
 * compatible with most email clients. Override per-app by editing this file.
 *
 * NOTE: Production templates should be moved to React-Email or MJML for richer layouts.
 */

const baseStyles = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#1f2937;max-width:560px;margin:0 auto;padding:24px`;

const wrap = (title: string, body: string): string => `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="background:#f3f4f6;margin:0;padding:24px">
  <div style="${baseStyles};background:#ffffff;border-radius:8px;border:1px solid #e5e7eb">
    <h2 style="color:#0f172a;margin-top:0">${title}</h2>
    ${body}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="color:#6b7280;font-size:12px;margin:0">
      Email otomatis — jangan balas. © ArahKarya — PT Arah Karya Sinergi.
    </p>
  </div>
</body>
</html>`;

export const welcomeEmail = (params: { name: string; appUrl: string }) =>
  wrap(
    `Selamat datang, ${params.name}`,
    `<p>Akun Anda di ArahKarya sudah aktif. Klik tombol di bawah untuk mulai.</p>
     <p><a href="${params.appUrl}" style="display:inline-block;background:#2563ab;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px">Buka Aplikasi</a></p>`,
  );

export const passwordResetEmail = (params: { name: string; resetUrl: string; expiresInMinutes: number }) =>
  wrap(
    'Reset password',
    `<p>Halo ${params.name},</p>
     <p>Kami terima permintaan reset password. Klik link di bawah untuk lanjut. Link berlaku ${params.expiresInMinutes} menit.</p>
     <p><a href="${params.resetUrl}" style="display:inline-block;background:#2563ab;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px">Reset Password</a></p>
     <p style="color:#6b7280;font-size:12px">Jika Anda tidak meminta reset, abaikan email ini.</p>`,
  );

export const verifyEmail = (params: { name: string; verifyUrl: string }) =>
  wrap(
    'Verifikasi email',
    `<p>Halo ${params.name}, klik link di bawah untuk verifikasi email Anda.</p>
     <p><a href="${params.verifyUrl}" style="display:inline-block;background:#2563ab;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px">Verifikasi Email</a></p>`,
  );

export const inviteEmail = (params: { inviterName: string; inviteUrl: string; appName: string }) =>
  wrap(
    `Undangan bergabung dengan ${params.appName}`,
    `<p><strong>${params.inviterName}</strong> mengundang Anda bergabung dengan ${params.appName}.</p>
     <p><a href="${params.inviteUrl}" style="display:inline-block;background:#2563ab;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px">Terima Undangan</a></p>`,
  );

export const invoiceEmail = (params: { name: string; invoiceNumber: string; amount: string; dueDate: string; payUrl: string }) =>
  wrap(
    `Tagihan ${params.invoiceNumber}`,
    `<p>Halo ${params.name},</p>
     <p>Tagihan Anda <strong>${params.invoiceNumber}</strong> sebesar <strong>${params.amount}</strong> jatuh tempo <strong>${params.dueDate}</strong>.</p>
     <p><a href="${params.payUrl}" style="display:inline-block;background:#2563ab;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px">Bayar Sekarang</a></p>`,
  );
