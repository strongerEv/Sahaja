import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminNav from '@/components/admin/AdminNav';

export const metadata = { title: 'Admin platform' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role_platform')
    .eq('id', user.id)
    .maybeSingle();

  // RLS sudah membatasi datanya, tapi halamannya juga tidak perlu terbuka.
  if (profile?.role_platform !== 'platform_admin') {
    return (
      <main className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="font-display text-3xl">Akses ditolak</h1>
        <p className="mt-2 text-sm text-muted">
          Halaman ini hanya untuk admin platform Sahaja.
        </p>
        <Link href="/dashboard" className="btn-ghost mt-6">
          Kembali ke dashboard
        </Link>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="font-display text-xl tracking-[0.2em] text-brand-600">
              SAHAJA
            </Link>
            <span className="badge bg-ink text-white">Admin platform</span>
          </div>
          <Link href="/dashboard" className="btn-ghost btn-sm">
            Dashboard saya
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <AdminNav />
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
