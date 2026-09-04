import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('name, email, role_platform')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Link href="/dashboard" className="font-display text-xl tracking-[0.2em] text-brand-600">
            SAHAJA
          </Link>
          <div className="flex items-center gap-3">
            {profile?.role_platform === 'platform_admin' && (
              <Link href="/admin" className="btn-ghost btn-sm">
                Admin platform
              </Link>
            )}
            <span className="hidden text-sm text-muted sm:block">
              {profile?.name ?? profile?.email ?? user.email}
            </span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="btn-ghost btn-sm">
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
