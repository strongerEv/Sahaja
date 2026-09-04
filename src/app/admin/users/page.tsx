import { createClient } from '@/lib/supabase/server';
import { formatShortDate } from '@/lib/format';
import type { AppUser } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('users')
    .select('*, weddings:weddings(id)')
    .order('created_at', { ascending: false })
    .limit(200);

  const users = (data ?? []) as Array<AppUser & { weddings: Array<{ id: string }> | null }>;

  return (
    <div className="card">
      <h1 className="font-display text-2xl">Pengguna</h1>
      <p className="mt-1 text-sm text-muted">200 pendaftar terbaru.</p>

      <div className="mt-5 -mx-5 overflow-x-auto px-5">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
              <th className="py-2.5 pr-3">Nama</th>
              <th className="py-2.5 pr-3">Email</th>
              <th className="py-2.5 pr-3">Peran</th>
              <th className="py-2.5 pr-3">Undangan</th>
              <th className="py-2.5">Terdaftar</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-line/60">
                <td className="py-3 pr-3 font-medium">{user.name ?? '-'}</td>
                <td className="py-3 pr-3 text-muted">{user.email}</td>
                <td className="py-3 pr-3">
                  <span
                    className={
                      user.role_platform === 'platform_admin'
                        ? 'badge bg-ink text-white'
                        : 'badge bg-cream text-muted'
                    }
                  >
                    {user.role_platform === 'platform_admin' ? 'Admin platform' : 'User'}
                  </span>
                </td>
                <td className="py-3 pr-3">{user.weddings?.length ?? 0}</td>
                <td className="py-3 text-xs text-muted">{formatShortDate(user.created_at)}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-muted">
                  Belum ada pengguna.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
