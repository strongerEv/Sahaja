import { createClient } from '@/lib/supabase/server';
import GuestManager from '@/components/dashboard/GuestManager';
import type { Guest } from '@/lib/types/database';

export const metadata = { title: 'Daftar tamu' };
export const dynamic = 'force-dynamic';

export default async function GuestsPage({ params }: { params: { weddingId: string } }) {
  const supabase = createClient();

  const [{ data: guests }, { data: invitation }] = await Promise.all([
    supabase
      .from('guests')
      .select('*')
      .eq('wedding_id', params.weddingId)
      .order('created_at', { ascending: false }),
    supabase
      .from('invitations')
      .select('slug')
      .eq('wedding_id', params.weddingId)
      .maybeSingle(),
  ]);

  return (
    <GuestManager
      weddingId={params.weddingId}
      guests={(guests ?? []) as Guest[]}
      invitationSlug={invitation?.slug ?? ''}
    />
  );
}
