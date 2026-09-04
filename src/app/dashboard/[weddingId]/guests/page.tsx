import { createClient } from '@/lib/supabase/server';
import GuestManager from '@/components/dashboard/GuestManager';
import { demoGuests, demoInvitation, isDemoMode } from '@/lib/demo/data';
import type { Guest } from '@/lib/types/database';

export const metadata = { title: 'Daftar tamu' };
export const dynamic = 'force-dynamic';

async function loadGuests(weddingId: string) {
  if (isDemoMode) {
    return { guests: demoGuests, slug: demoInvitation.slug };
  }

  const supabase = createClient();
  const [{ data: guests }, { data: invitation }] = await Promise.all([
    supabase
      .from('guests')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false }),
    supabase.from('invitations').select('slug').eq('wedding_id', weddingId).maybeSingle(),
  ]);

  return { guests: (guests ?? []) as Guest[], slug: invitation?.slug ?? '' };
}

export default async function GuestsPage({ params }: { params: { weddingId: string } }) {
  const { guests, slug } = await loadGuests(params.weddingId);

  return <GuestManager weddingId={params.weddingId} guests={guests} invitationSlug={slug} />;
}
