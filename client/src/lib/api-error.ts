/** Ambil pesan error yang ramah dari error axios envelope `{ error: { message } }`. */
export function getApiErrorMessage(err: unknown, fallback = 'Terjadi kesalahan'): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    return response?.data?.error?.message ?? fallback;
  }
  return fallback;
}
