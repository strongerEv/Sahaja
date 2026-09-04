import { siteUrl } from '@/lib/site-url';
import type { GalleryLayout, SectionKey, SectionsConfig } from '@/lib/types/database';

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/** Alfabet tanpa karakter ambigu (0/O, 1/l/I) supaya link enak dibaca. */
const SLUG_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

/**
 * Slug acak untuk link tamu. Sengaja BUKAN nama asli supaya tamu tidak bisa
 * menebak link tamu lain (lihat catatan spesifikasi bagian 6).
 */
export function randomSlug(length = 8) {
  let out = '';
  const bytes =
    typeof crypto !== 'undefined' && 'getRandomValues' in crypto
      ? crypto.getRandomValues(new Uint8Array(length))
      : null;
  for (let i = 0; i < length; i += 1) {
    const n = bytes ? bytes[i] : Math.floor(Math.random() * 256);
    out += SLUG_ALPHABET[n % SLUG_ALPHABET.length];
  }
  return out;
}

/** Slug undangan dari nama pasangan: "Rizky & Ayu" -> "rizky-ayu". */
export function slugifyCouple(groom: string, bride: string) {
  const base = `${groom}-${bride}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || `undangan-${randomSlug(5)}`;
}

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'hero',
  'couple',
  'countdown',
  'events',
  'love_story',
  'gallery',
  'rsvp',
  'guestbook',
  'envelope',
  'closing',
];

export const GALLERY_LAYOUTS: GalleryLayout[] = ['grid', 'masonry', 'carousel', 'highlight'];

export const GALLERY_LAYOUT_LABELS: Record<GalleryLayout, string> = {
  grid: 'Kotak seragam',
  masonry: 'Tinggi bervariasi',
  carousel: 'Geser samping',
  highlight: 'Satu foto utama',
};

export const GALLERY_LAYOUT_HINTS: Record<GalleryLayout, string> = {
  grid: 'Semua foto dipotong jadi kotak sama besar. Paling rapi dan mudah dibaca.',
  masonry: 'Foto mengikuti proporsi aslinya, jadi potret dan lanskap tidak terpotong.',
  carousel: 'Satu baris yang digeser ke samping. Halaman jadi lebih pendek.',
  highlight: 'Satu foto besar di atas, sisanya menyusul sebagai kotak kecil.',
};

export const DEFAULT_SECTIONS: SectionsConfig = {
  hero: true,
  couple: true,
  countdown: true,
  events: true,
  gallery: true,
  love_story: true,
  rsvp: true,
  guestbook: true,
  envelope: true,
  closing: true,
  order: DEFAULT_SECTION_ORDER,
  gallery_layout: 'grid',
  gallery_columns: 3,
  gallery_limit: null,
};

export const SECTION_LABELS: Record<SectionKey, string> = {
  hero: 'Sampul',
  couple: 'Mempelai',
  countdown: 'Hitung Mundur',
  events: 'Acara',
  gallery: 'Galeri',
  love_story: 'Cerita Cinta',
  rsvp: 'RSVP',
  guestbook: 'Buku Tamu',
  envelope: 'Amplop Digital',
  closing: 'Penutup',
};

export function resolveSections(config: Partial<SectionsConfig> | null | undefined): SectionsConfig {
  const merged = { ...DEFAULT_SECTIONS, ...(config ?? {}) };
  const order = Array.isArray(merged.order) && merged.order.length
    ? merged.order.filter((key): key is SectionKey => key in SECTION_LABELS)
    : DEFAULT_SECTION_ORDER;
  // Section baru yang belum ada di config lama tetap ikut tampil di akhir.
  const missing = DEFAULT_SECTION_ORDER.filter((key) => !order.includes(key));

  // Nilai galeri dinormalkan supaya config lama (atau yang disunting manual)
  // tidak menghasilkan layout yang tidak dikenal.
  const limit = merged.gallery_limit;

  return {
    ...merged,
    order: [...order, ...missing],
    gallery_layout: GALLERY_LAYOUTS.includes(merged.gallery_layout)
      ? merged.gallery_layout
      : 'grid',
    gallery_columns: merged.gallery_columns === 2 ? 2 : 3,
    gallery_limit: typeof limit === 'number' && limit > 0 ? Math.min(limit, 60) : null,
  };
}

export { siteUrl };

export function invitationUrl(slug: string, guestSlug?: string | null) {
  const base = `${siteUrl()}/u/${slug}`;
  return guestSlug ? `${base}?to=${guestSlug}` : base;
}
