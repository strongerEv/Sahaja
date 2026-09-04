import Link from 'next/link';

/**
 * Penanda bahwa aplikasi berjalan tanpa Supabase. Sengaja selalu terlihat
 * supaya tidak ada yang mengira datanya nyata atau tersimpan.
 */
export default function DemoBanner() {
  return (
    <div className="bg-ink px-4 py-2 text-center text-xs text-cream">
      <span className="font-medium">Mode demo</span> — data di bawah hanya contoh dan
      perubahan tidak disimpan.{' '}
      <Link href="/demo" className="underline underline-offset-2">
        Cara mengaktifkan penyimpanan
      </Link>
    </div>
  );
}
