const TZ = 'Asia/Jakarta';

export function formatDate(value?: string | null, locale: 'id' | 'en' = 'id') {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  });
}

export function formatShortDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: TZ,
  });
}

export function formatTime(value?: string | null, locale: 'id' | 'en' = 'id') {
  if (!value) return '-';
  const time = new Date(value).toLocaleTimeString(locale === 'id' ? 'id-ID' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  });
  return locale === 'id' ? `${time} WIB` : `${time} (GMT+7)`;
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return `${formatShortDate(value)} · ${formatTime(value)}`;
}

export function formatIDR(amount?: number | null) {
  if (amount == null) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Nilai untuk <input type="datetime-local"> dari timestamptz, dalam WIB. */
export function toDatetimeLocal(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/** Kebalikan toDatetimeLocal: input lokal (WIB) -> ISO string. */
export function fromDatetimeLocal(value: string) {
  if (!value) return null;
  // Offset WIB tetap +07:00 (Indonesia tidak pakai DST).
  return new Date(`${value}:00+07:00`).toISOString();
}
