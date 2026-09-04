import { createClient } from '@/lib/supabase/server';
import { demoPlatformStats, isDemoMode } from '@/lib/demo/data';

export const dynamic = 'force-dynamic';

async function loadStats() {
  if (isDemoMode) return demoPlatformStats;

  const supabase = createClient();
  const [users, weddings, invitations, published, guests, templates] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('weddings').select('id', { count: 'exact', head: true }),
    supabase.from('invitations').select('id', { count: 'exact', head: true }),
    supabase.from('invitations').select('id', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('guests').select('id', { count: 'exact', head: true }),
    supabase.from('templates').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  return {
    users: users.count ?? 0,
    weddings: weddings.count ?? 0,
    invitations: invitations.count ?? 0,
    published: published.count ?? 0,
    guests: guests.count ?? 0,
    templates: templates.count ?? 0,
  };
}

export default async function AdminOverview() {
  const counts = await loadStats();

  const stats = [
    { label: 'Pengguna terdaftar', value: counts.users },
    { label: 'Wedding project', value: counts.weddings },
    { label: 'Undangan dibuat', value: counts.invitations },
    { label: 'Undangan live', value: counts.published },
    { label: 'Total tamu terdaftar', value: counts.guests },
    { label: 'Template aktif', value: counts.templates },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="card">
          <p className="text-sm text-muted">{stat.label}</p>
          <p className="mt-1 font-display text-4xl text-brand-600">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
