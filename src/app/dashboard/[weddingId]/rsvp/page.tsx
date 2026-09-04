import { createClient } from '@/lib/supabase/server';
import RsvpRecap from '@/components/dashboard/RsvpRecap';
import type { Guest, Rsvp } from '@/lib/types/database';

export const metadata = { title: 'Rekap RSVP' };
export const dynamic = 'force-dynamic';

export type GuestRsvpRow = Guest & { rsvps: Rsvp | Rsvp[] | null };

export default async function RsvpPage({ params }: { params: { weddingId: string } }) {
  const supabase = createClient();

  const { data } = await supabase
    .from('guests')
    .select('*, rsvps(*)')
    .eq('wedding_id', params.weddingId)
    .order('name');

  return <RsvpRecap rows={(data ?? []) as GuestRsvpRow[]} />;
}
