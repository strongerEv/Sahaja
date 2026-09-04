/**
 * Penanda mode demo, dipisah dari dataset contohnya supaya middleware dan
 * komponen client cukup membundel satu boolean, bukan seluruh data contoh.
 *
 * Mode demo menyala bila kredensial Supabase belum lengkap. Variabel yang
 * terdefinisi tapi kosong dihitung sebagai belum diisi — di Vercel sebuah
 * environment variable tanpa nilai tetap terbaca sebagai string kosong, dan
 * meneruskannya ke supabase-js membuat aplikasi gagal dengan pesan yang
 * membingungkan ("supabaseUrl is required").
 */

function isFilled(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

const hasSupabaseCredentials =
  isFilled(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  isFilled(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === '1' || !hasSupabaseCredentials;

export const DEMO_NOTICE =
  'Mode demo aktif — perubahan tidak disimpan. Isi kredensial Supabase di environment untuk mengaktifkan penyimpanan.';
