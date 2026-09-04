import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Client anon tanpa sesi, khusus halaman undangan publik (/u/[slug]).
 * Sengaja dipisah dari client dashboard: tidak menyentuh cookie sama sekali
 * supaya halaman tamu tetap ringan & bisa di-cache.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
