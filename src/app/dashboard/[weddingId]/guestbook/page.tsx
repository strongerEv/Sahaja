import { createClient } from '@/lib/supabase/server';
import GuestbookModeration from '@/components/dashboard/GuestbookModeration';
import type { GuestbookEntry } from '@/lib/types/database';

export const metadata = { title: 'Buku tamu' };
export const dynamic = 'force-dynamic';

export default async function GuestbookPage({ params }: { params: { weddingId: string } }) {
  const supabase = createClient();

  const { data: invitation } = await supabase
    .from('invitations')
    .select('id')
    .eq('wedding_id', params.weddingId)
    .maybeSingle();

  const { data: entries } = invitation
    ? await supabase
        .from('guestbook_entries')
        .select('*')
        .eq('invitation_id', invitation.id)
        .order('created_at', { ascending: false })
    : { data: [] };

  return (
    <GuestbookModeration
      weddingId={params.weddingId}
      entries={(entries ?? []) as GuestbookEntry[]}
    />
  );
}
