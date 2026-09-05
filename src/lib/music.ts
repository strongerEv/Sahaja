/**
 * Sumber musik latar undangan.
 *
 * Pasangan boleh menempel tautan YouTube (paling praktis, tidak perlu punya
 * berkas lagunya) atau tautan/unggahan berkas audio langsung. Keduanya baru
 * diputar setelah tamu menekan "Buka Undangan" — sentuhan itulah yang
 * membuat browser mengizinkan suara; tanpa gerbang tersebut autoplay selalu
 * diblokir.
 */

export type MusicSource =
  | { kind: 'youtube'; videoId: string }
  | { kind: 'audio'; url: string }
  | null;

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** Mengenali berbagai bentuk tautan YouTube, termasuk Shorts dan youtu.be. */
export function parseMusicUrl(value?: string | null): MusicSource {
  const raw = value?.trim();
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase();

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0];
    return YOUTUBE_ID.test(id) ? { kind: 'youtube', videoId: id } : null;
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    const fromQuery = url.searchParams.get('v');
    if (fromQuery && YOUTUBE_ID.test(fromQuery)) {
      return { kind: 'youtube', videoId: fromQuery };
    }
    // /shorts/<id>, /embed/<id>, /live/<id>
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length >= 2 && ['shorts', 'embed', 'live', 'v'].includes(segments[0])) {
      const id = segments[1];
      if (YOUTUBE_ID.test(id)) return { kind: 'youtube', videoId: id };
    }
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  // Tanpa syarat ini, satu kata seperti "lagu-favorit" ikut lolos: skema
  // https:// yang kita tambahkan sendiri membuatnya jadi URL yang sah.
  const audioHost = url.hostname;
  if (!audioHost.includes('.') || audioHost.startsWith('.') || audioHost.endsWith('.')) {
    return null;
  }

  return { kind: 'audio', url: url.toString() };
}

/** Keterangan singkat untuk builder, supaya pasangan tahu tautannya terbaca. */
export function describeMusicSource(source: MusicSource): string {
  if (!source) return 'Belum ada musik dipilih.';
  if (source.kind === 'youtube') return `Terbaca sebagai video YouTube (${source.videoId}).`;
  return 'Terbaca sebagai berkas audio langsung.';
}
