import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { demoUser, isDemoMode } from '@/lib/demo/data';
import DemoBanner from '@/components/DemoBanner';

async function loadProfile() {
  if (isDemoMode) {
    return { name: demoUser.name, email: demoUser.email, role_platform: demoUser.role_platform };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('users')
    .select('name, email, role_platform')
    .eq('id', user.id)
    .maybeSingle();

  return data ?? { name: null, email: user.email ?? null, role_platform: 'user' as const };
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await loadProfile();

  return (
    <div className="min-h-screen">
      {isDemoMode && <DemoBanner />}
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
              {profile?.name ?? profile?.email}
            </span>
            {!isDemoMode && (
              <form action="/auth/signout" method="post">
                <button type="submit" className="btn-ghost btn-sm">
                  Keluar
                </button>
              </form>
            )}
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
