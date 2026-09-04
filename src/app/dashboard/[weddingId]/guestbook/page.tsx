import { createClient } from '@/lib/supabase/server';
import GuestbookModeration from '@/components/dashboard/GuestbookModeration';
import { demoGuestbook, isDemoMode } from '@/lib/demo/data';
import type { GuestbookEntry } from '@/lib/types/database';

export const metadata = { title: 'Buku tamu' };
export const dynamic = 'force-dynamic';

async function loadEntries(weddingId: string): Promise<GuestbookEntry[]> {
  if (isDemoMode) return demoGuestbook;

  const supabase = createClient();
  const { data: invitation } = await supabase
    .from('invitations')
    .select('id')
    .eq('wedding_id', weddingId)
    .maybeSingle();

  if (!invitation) return [];

  const { data } = await supabase
    .from('guestbook_entries')
    .select('*')
    .eq('invitation_id', invitation.id)
    .order('created_at', { ascending: false });

  return (data ?? []) as GuestbookEntry[];
}

export default async function GuestbookPage({ params }: { params: { weddingId: string } }) {
  return (
    <GuestbookModeration
      weddingId={params.weddingId}
      entries={await loadEntries(params.weddingId)}
    />
  );
}
