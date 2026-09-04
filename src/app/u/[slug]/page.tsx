import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase/public';
import { createClient } from '@/lib/supabase/server';
import InvitationView from '@/components/invitation/InvitationView';
import { resolveSections } from '@/lib/utils';
import {
  DEMO_SLUG,
  demoEnvelope,
  demoGuestbook,
  demoGuests,
  demoInvitation,
  demoMedia,
  isDemoMode,
} from '@/lib/demo/data';
import type {
  DigitalEnvelopeConfig,
  GuestbookEntry,
  Invitation,
  InvitationMedia,
} from '@/lib/types/database';

type Params = { params: { slug: string }; searchParams: { to?: string; preview?: string } };

// Halaman tamu di-render di server dan di-cache sebentar supaya ringan diakses
// dari mana saja; RSVP & ucapan tetap real-time karena lewat RPC dari client.
export const revalidate = 60;

async function loadInvitation(slug: string, preview: boolean) {
  if (isDemoMode) {
    return slug === DEMO_SLUG ? demoInvitation : null;
  }

  if (preview) {
    // Pratinjau draft: pakai sesi pemilik, RLS yang menentukan boleh/tidaknya.
    const supabase = createClient();
    const { data } = await supabase.from('invitations').select('*').eq('slug', slug).maybeSingle();
    return data as Invitation | null;
  }

  const supabase = createPublicClient();
  const { data } = await supabase
    .from('invitations')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();
  return data as Invitation | null;
}

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const invitation = await loadInvitation(params.slug, searchParams.preview === '1');
  if (!invitation) return { title: 'Undangan tidak ditemukan' };

  const couple = `${invitation.groom_nickname ?? ''} & ${invitation.bride_nickname ?? ''}`.trim();
  const title = `Undangan Pernikahan ${couple}`;
  const description =
    invitation.language === 'en'
      ? `You are invited to the wedding of ${couple}.`
      : `Dengan hormat kami mengundang Anda ke pernikahan ${couple}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: invitation.cover_image_url ? [invitation.cover_image_url] : undefined,
      type: 'website',
    },
    robots: invitation.is_published ? undefined : { index: false, follow: false },
  };
}

/** Isi halaman selain undangan itu sendiri: media, amplop, ucapan, dan tamu. */
async function loadPageData(slug: string, invitationId: string, guestSlug: string | null) {
  if (isDemoMode) {
    const guest = guestSlug
      ? demoGuests.find((candidate) => candidate.unique_slug === guestSlug)
      : null;

    return {
      media: demoMedia,
      envelope: demoEnvelope,
      entries: demoGuestbook.filter((entry) => !entry.is_hidden),
      guest: guest ? { id: guest.id, name: guest.name } : null,
    };
  }

  const supabase = createPublicClient();
  const [{ data: media }, { data: envelope }, { data: entries }, guestResult] = await Promise.all([
    supabase
      .from('invitation_media')
      .select('*')
      .eq('invitation_id', invitationId)
      .order('order_index'),
    supabase
      .from('digital_envelopes_config')
      .select('*')
      .eq('invitation_id', invitationId)
      .maybeSingle(),
    supabase
      .from('guestbook_entries')
      .select('id, name, message, created_at')
      .eq('invitation_id', invitationId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(50),
    guestSlug
      ? supabase.rpc('get_public_guest', {
          p_invitation_slug: slug,
          p_guest_slug: guestSlug,
        })
      : Promise.resolve({ data: null }),
  ]);

  const guestRow = Array.isArray(guestResult.data) ? guestResult.data[0] : null;

  return {
    media: (media ?? []) as InvitationMedia[],
    envelope: (envelope ?? null) as DigitalEnvelopeConfig | null,
    entries: (entries ?? []) as GuestbookEntry[],
    guest: guestRow ? { id: guestRow.guest_id, name: guestRow.guest_name } : null,
  };
}

export default async function PublicInvitationPage({ params, searchParams }: Params) {
  const preview = searchParams.preview === '1';
  const invitation = await loadInvitation(params.slug, preview);
  if (!invitation) notFound();

  const guestSlug = searchParams.to?.trim() || null;
  const { media, envelope, entries, guest } = await loadPageData(
    params.slug,
    invitation.id,
    guestSlug,
  );

  return (
    <InvitationView
      invitation={invitation}
      sections={resolveSections(invitation.sections_config_json)}
      media={media}
      envelope={envelope}
      entries={entries}
      guest={guest}
      guestSlug={guestSlug}
      preview={preview && !invitation.is_published}
    />
  );
}
