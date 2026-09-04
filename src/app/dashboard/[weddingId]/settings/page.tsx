import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WeddingSettings from '@/components/dashboard/WeddingSettings';
import type { Wedding, WeddingMemberRole } from '@/lib/types/database';

export const metadata = { title: 'Pengaturan' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage({ params }: { params: { weddingId: string } }) {
  const supabase = createClient();

  const { data: wedding } = await supabase
    .from('weddings')
    .select('*')
    .eq('id', params.weddingId)
    .maybeSingle();

  if (!wedding) notFound();

  const { data: members } = await supabase
    .from('wedding_members')
    .select('id, role, user_id, users(name, email)')
    .eq('wedding_id', params.weddingId);

  // PostgREST mengembalikan relasi sebagai array; ratakan jadi satu objek.
  const memberRows = (members ?? []).map((member) => {
    const profile = Array.isArray(member.users) ? member.users[0] : member.users;
    return {
      id: member.id as string,
      role: member.role as WeddingMemberRole,
      user_id: member.user_id as string,
      users: (profile ?? null) as { name: string | null; email: string | null } | null,
    };
  });

  return <WeddingSettings wedding={wedding as Wedding} members={memberRows} />;
}
