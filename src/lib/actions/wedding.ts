'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_SECTIONS, randomSlug, slugifyCouple } from '@/lib/utils';
import { DEMO_NOTICE, isDemoMode } from '@/lib/demo/data';

export type ActionState = { error?: string; message?: string } | null;

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}

/** Cari slug undangan yang belum dipakai. */
async function uniqueInvitationSlug(
  supabase: ReturnType<typeof createClient>,
  base: string,
): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${randomSlug(4)}`;
    const { data } = await supabase
      .from('invitations')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${randomSlug(6)}`;
}

export async function createWedding(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (isDemoMode) return { error: DEMO_NOTICE };

  const { supabase, user } = await requireUser();

  const groom = String(formData.get('groom_name') ?? '').trim();
  const bride = String(formData.get('bride_name') ?? '').trim();
  const date = String(formData.get('wedding_date') ?? '').trim();
  const templateId = String(formData.get('template_id') ?? '').trim();

  if (!groom || !bride) {
    return { error: 'Nama mempelai pria dan wanita wajib diisi.' };
  }

  const { data: wedding, error: weddingError } = await supabase
    .from('weddings')
    .insert({
      owner_user_id: user.id,
      groom_name: groom,
      bride_name: bride,
      wedding_date: date || null,
      status: 'draft',
    })
    .select('id')
    .single();

  if (weddingError || !wedding) {
    return { error: weddingError?.message ?? 'Gagal membuat wedding.' };
  }

  const slug = await uniqueInvitationSlug(supabase, slugifyCouple(groom, bride));

  let themeColor = '#A6753F';
  let font = 'display';
  if (templateId) {
    const { data: template } = await supabase
      .from('templates')
      .select('default_config')
      .eq('id', templateId)
      .maybeSingle();
    themeColor = template?.default_config?.theme_color ?? themeColor;
    font = template?.default_config?.font ?? font;
  }

  const { data: invitation, error: invitationError } = await supabase
    .from('invitations')
    .insert({
      wedding_id: wedding.id,
      template_id: templateId || null,
      slug,
      groom_nickname: groom,
      bride_nickname: bride,
      theme_color: themeColor,
      font,
      sections_config_json: DEFAULT_SECTIONS,
    })
    .select('id')
    .single();

  if (invitationError || !invitation) {
    return { error: invitationError?.message ?? 'Gagal membuat undangan.' };
  }

  await supabase.from('digital_envelopes_config').insert({ invitation_id: invitation.id });

  revalidatePath('/dashboard');
  redirect(`/dashboard/${wedding.id}/builder`);
}

export async function updateWedding(weddingId: string, formData: FormData) {
  if (isDemoMode) return { error: DEMO_NOTICE };

  const { supabase } = await requireUser();

  const { error } = await supabase
    .from('weddings')
    .update({
      groom_name: String(formData.get('groom_name') ?? '').trim(),
      bride_name: String(formData.get('bride_name') ?? '').trim(),
      wedding_date: String(formData.get('wedding_date') ?? '') || null,
      status: String(formData.get('status') ?? 'draft') as 'draft' | 'active' | 'archived',
    })
    .eq('id', weddingId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${weddingId}`);
  return { message: 'Data wedding tersimpan.' };
}

export async function deleteWedding(weddingId: string) {
  if (isDemoMode) return { error: DEMO_NOTICE };

  const { supabase } = await requireUser();
  const { error } = await supabase.from('weddings').delete().eq('id', weddingId);
  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  redirect('/dashboard');
}
