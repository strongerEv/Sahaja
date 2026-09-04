/**
 * URL dasar situs — dipakai untuk metadata halaman dan link undangan per tamu.
 *
 * Sengaja tidak pernah melempar error. Sebelumnya root layout memanggil
 * `new URL(process.env.NEXT_PUBLIC_SITE_URL ?? '...')` secara langsung; operator
 * `??` hanya jatuh ke nilai bawaan saat variabelnya null/undefined, sehingga
 * variabel yang terdefinisi tapi kosong — atau diisi tanpa skema seperti
 * "sahaja.vercel.app" — membuat `new URL()` melempar TypeError dan menjatuhkan
 * seluruh build ("Failed to collect page data for /_not-found").
 */

const FALLBACK = 'http://localhost:3000';

function normalize(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  // Nilai yang disalin dari address bar biasanya tidak membawa skema.
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    return new URL(candidate).origin;
  } catch {
    return null;
  }
}

export function siteUrl(): string {
  return (
    normalize(process.env.NEXT_PUBLIC_SITE_URL) ??
    // Disediakan otomatis oleh Vercel (tanpa skema), jadi link tetap benar
    // walau NEXT_PUBLIC_SITE_URL belum diatur.
    normalize(process.env.NEXT_PUBLIC_VERCEL_URL) ??
    FALLBACK
  );
}

/** Versi URL object untuk `metadataBase`. */
export function siteUrlObject(): URL {
  try {
    return new URL(siteUrl());
  } catch {
    return new URL(FALLBACK);
  }
}
