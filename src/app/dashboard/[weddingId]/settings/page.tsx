import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WeddingSettings from '@/components/dashboard/WeddingSettings';
import { demoMembers, demoWedding, isDemoMode } from '@/lib/demo/data';
import type { Wedding, WeddingMemberRole } from '@/lib/types/database';

export const metadata = { title: 'Pengaturan' };
export const dynamic = 'force-dynamic';

type MemberRow = {
  id: string;
  role: WeddingMemberRole;
  user_id: string;
  users: { name: string | null; email: string | null } | null;
};

async function loadSettings(weddingId: string): Promise<{
  wedding: Wedding | null;
  members: MemberRow[];
}> {
  if (isDemoMode) {
    return { wedding: demoWedding, members: demoMembers };
  }

  const supabase = createClient();
  const { data: wedding } = await supabase
    .from('weddings')
    .select('*')
    .eq('id', weddingId)
    .maybeSingle();

  if (!wedding) return { wedding: null, members: [] };

  const { data: members } = await supabase
    .from('wedding_members')
    .select('id, role, user_id, users(name, email)')
    .eq('wedding_id', weddingId);

  // PostgREST mengembalikan relasi sebagai array; ratakan jadi satu objek.
  const memberRows: MemberRow[] = (members ?? []).map((member) => {
    const profile = Array.isArray(member.users) ? member.users[0] : member.users;
    return {
      id: member.id as string,
      role: member.role as WeddingMemberRole,
      user_id: member.user_id as string,
      users: (profile ?? null) as { name: string | null; email: string | null } | null,
    };
  });

  return { wedding: wedding as Wedding, members: memberRows };
}

export default async function SettingsPage({ params }: { params: { weddingId: string } }) {
  const { wedding, members } = await loadSettings(params.weddingId);
  if (!wedding) notFound();

  return <WeddingSettings wedding={wedding} members={members} />;
}
