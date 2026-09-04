import { createClient } from '@/lib/supabase/server';
import RsvpRecap from '@/components/dashboard/RsvpRecap';
import { demoGuestsWithRsvp, isDemoMode } from '@/lib/demo/data';
import type { Guest, Rsvp } from '@/lib/types/database';

export const metadata = { title: 'Rekap RSVP' };
export const dynamic = 'force-dynamic';

export type GuestRsvpRow = Guest & { rsvps: Rsvp | Rsvp[] | null };

async function loadRows(weddingId: string): Promise<GuestRsvpRow[]> {
  if (isDemoMode) return demoGuestsWithRsvp;

  const supabase = createClient();
  const { data } = await supabase
    .from('guests')
    .select('*, rsvps(*)')
    .eq('wedding_id', weddingId)
    .order('name');

  return (data ?? []) as GuestRsvpRow[];
}

export default async function RsvpPage({ params }: { params: { weddingId: string } }) {
  return <RsvpRecap rows={await loadRows(params.weddingId)} />;
}
