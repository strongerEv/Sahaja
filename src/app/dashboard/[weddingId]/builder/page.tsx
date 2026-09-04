import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import BuilderWizard from '@/components/builder/BuilderWizard';
import {
  demoEnvelope,
  demoInvitation,
  demoMedia,
  demoTemplates,
  isDemoMode,
} from '@/lib/demo/data';
import type {
  DigitalEnvelopeConfig,
  Invitation,
  InvitationMedia,
  Template,
} from '@/lib/types/database';

export const metadata = { title: 'Builder undangan' };
export const dynamic = 'force-dynamic';

async function loadBuilder(weddingId: string) {
  if (isDemoMode) {
    return {
      invitation: demoInvitation,
      templates: demoTemplates,
      media: demoMedia,
      envelope: demoEnvelope,
    };
  }

  const supabase = createClient();
  const { data: invitation } = await supabase
    .from('invitations')
    .select('*')
    .eq('wedding_id', weddingId)
    .maybeSingle();

  if (!invitation) return null;

  const [{ data: templates }, { data: media }, { data: envelope }] = await Promise.all([
    supabase.from('templates').select('*').eq('is_active', true).order('name'),
    supabase
      .from('invitation_media')
      .select('*')
      .eq('invitation_id', invitation.id)
      .order('order_index'),
    supabase
      .from('digital_envelopes_config')
      .select('*')
      .eq('invitation_id', invitation.id)
      .maybeSingle(),
  ]);

  return {
    invitation: invitation as Invitation,
    templates: (templates ?? []) as Template[],
    media: (media ?? []) as InvitationMedia[],
    envelope: (envelope ?? null) as DigitalEnvelopeConfig | null,
  };
}

export default async function BuilderPage({ params }: { params: { weddingId: string } }) {
  const data = await loadBuilder(params.weddingId);
  if (!data) notFound();

  return (
    <BuilderWizard
      weddingId={params.weddingId}
      invitation={data.invitation}
      templates={data.templates}
      media={data.media}
      envelope={data.envelope}
    />
  );
}
