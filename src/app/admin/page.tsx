import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminOverview() {
  const supabase = createClient();

  const [users, weddings, invitations, published, guests, templates] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('weddings').select('id', { count: 'exact', head: true }),
    supabase.from('invitations').select('id', { count: 'exact', head: true }),
    supabase.from('invitations').select('id', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('guests').select('id', { count: 'exact', head: true }),
    supabase.from('templates').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  const stats = [
    { label: 'Pengguna terdaftar', value: users.count ?? 0 },
    { label: 'Wedding project', value: weddings.count ?? 0 },
    { label: 'Undangan dibuat', value: invitations.count ?? 0 },
    { label: 'Undangan live', value: published.count ?? 0 },
    { label: 'Total tamu terdaftar', value: guests.count ?? 0 },
    { label: 'Template aktif', value: templates.count ?? 0 },
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
