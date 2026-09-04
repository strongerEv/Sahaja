'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fromDatetimeLocal } from '@/lib/format';
import type { LoveStoryItem, SectionsConfig } from '@/lib/types/database';

type Result = { error?: string; message?: string };

async function ctx() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return supabase;
}

function str(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? '').trim();
  return value === '' ? null : value;
}

/** Simpan satu langkah wizard. `step` menentukan kolom mana yang ditulis. */
export async function saveInvitationStep(
  weddingId: string,
  invitationId: string,
  step: string,
  formData: FormData,
): Promise<Result> {
  const supabase = await ctx();
  let patch: Record<string, unknown> = {};

  switch (step) {
    case 'template':
      patch = {
        template_id: str(formData, 'template_id'),
        language: str(formData, 'language') ?? 'id',
      };
      break;

    case 'couple':
      patch = {
        groom_nickname: str(formData, 'groom_nickname'),
        groom_full_name: str(formData, 'groom_full_name'),
        groom_child_order: str(formData, 'groom_child_order'),
        groom_father: str(formData, 'groom_father'),
        groom_mother: str(formData, 'groom_mother'),
        bride_nickname: str(formData, 'bride_nickname'),
        bride_full_name: str(formData, 'bride_full_name'),
        bride_child_order: str(formData, 'bride_child_order'),
        bride_father: str(formData, 'bride_father'),
        bride_mother: str(formData, 'bride_mother'),
        quote_text: str(formData, 'quote_text'),
      };
      break;

    case 'events': {
      const akad = str(formData, 'akad_datetime');
      const resepsi = str(formData, 'resepsi_datetime');
      patch = {
        akad_datetime: akad ? fromDatetimeLocal(akad) : null,
        akad_location: str(formData, 'akad_location'),
        akad_address: str(formData, 'akad_address'),
        akad_maps_url: str(formData, 'akad_maps_url'),
        resepsi_datetime: resepsi ? fromDatetimeLocal(resepsi) : null,
        resepsi_location: str(formData, 'resepsi_location'),
        resepsi_address: str(formData, 'resepsi_address'),
        resepsi_maps_url: str(formData, 'resepsi_maps_url'),
      };
      break;
    }

    case 'story': {
      const raw = String(formData.get('love_story_json') ?? '[]');
      let story: LoveStoryItem[] = [];
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          story = parsed
            .filter((item) => item && typeof item.title === 'string' && item.title.trim())
            .slice(0, 20);
        }
      } catch {
        return { error: 'Format cerita cinta tidak valid.' };
      }
      patch = { love_story_json: story };
      break;
    }

    case 'music':
      patch = { music_url: str(formData, 'music_url') };
      break;

    case 'theme': {
      const raw = String(formData.get('sections_config_json') ?? '{}');
      let sections: Partial<SectionsConfig> = {};
      try {
        sections = JSON.parse(raw);
      } catch {
        return { error: 'Konfigurasi section tidak valid.' };
      }
      patch = {
        theme_color: str(formData, 'theme_color') ?? '#A6753F',
        font: str(formData, 'font') ?? 'display',
        cover_image_url: str(formData, 'cover_image_url'),
        closing_text: str(formData, 'closing_text'),
        sections_config_json: sections,
      };
      break;
    }

    case 'envelope': {
      const { error: envelopeError } = await supabase.from('digital_envelopes_config').upsert(
        {
          invitation_id: invitationId,
          is_enabled: formData.get('is_enabled') === 'on',
          bank_name: str(formData, 'bank_name'),
          account_number: str(formData, 'account_number'),
          account_holder: str(formData, 'account_holder'),
          bank_name_2: str(formData, 'bank_name_2'),
          account_number_2: str(formData, 'account_number_2'),
          account_holder_2: str(formData, 'account_holder_2'),
          ewallet_qris_url: str(formData, 'ewallet_qris_url'),
          gift_address: str(formData, 'gift_address'),
          note: str(formData, 'note'),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'invitation_id' },
      );
      if (envelopeError) return { error: envelopeError.message };
      revalidatePath(`/dashboard/${weddingId}/builder`);
      return { message: 'Amplop digital tersimpan.' };
    }

    default:
      return { error: `Langkah "${step}" tidak dikenal.` };
  }

  const { error } = await supabase.from('invitations').update(patch).eq('id', invitationId);
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${weddingId}/builder`);
  return { message: 'Tersimpan.' };
}

export async function togglePublish(
  weddingId: string,
  invitationId: string,
  publish: boolean,
): Promise<Result> {
  const supabase = await ctx();

  if (publish) {
    const { data: invitation } = await supabase
      .from('invitations')
      .select('akad_datetime, resepsi_datetime, groom_nickname, bride_nickname')
      .eq('id', invitationId)
      .single();

    if (!invitation?.groom_nickname || !invitation?.bride_nickname) {
      return { error: 'Lengkapi nama panggilan kedua mempelai sebelum publikasi.' };
    }
    if (!invitation.akad_datetime && !invitation.resepsi_datetime) {
      return { error: 'Isi minimal satu jadwal acara (akad atau resepsi) sebelum publikasi.' };
    }
  }

  const { error } = await supabase
    .from('invitations')
    .update({
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null,
    })
    .eq('id', invitationId);

  if (error) return { error: error.message };

  if (publish) {
    await supabase.from('weddings').update({ status: 'active' }).eq('id', weddingId);
  }

  revalidatePath(`/dashboard/${weddingId}`, 'layout');
  return { message: publish ? 'Undangan dipublikasikan.' : 'Undangan disimpan sebagai draft.' };
}

export async function addMedia(
  weddingId: string,
  invitationId: string,
  items: Array<{ url: string; type: 'photo' | 'video'; caption?: string }>,
): Promise<Result> {
  const supabase = await ctx();
  if (!items.length) return { message: 'Tidak ada media baru.' };

  const { count } = await supabase
    .from('invitation_media')
    .select('id', { count: 'exact', head: true })
    .eq('invitation_id', invitationId);

  const start = count ?? 0;
  const { error } = await supabase.from('invitation_media').insert(
    items.map((item, index) => ({
      invitation_id: invitationId,
      url: item.url,
      type: item.type,
      caption: item.caption ?? null,
      order_index: start + index,
    })),
  );

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${weddingId}/builder`);
  return { message: `${items.length} media ditambahkan.` };
}

export async function deleteMedia(weddingId: string, mediaId: string): Promise<Result> {
  const supabase = await ctx();
  const { error } = await supabase.from('invitation_media').delete().eq('id', mediaId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${weddingId}/builder`);
  return { message: 'Media dihapus.' };
}

export async function reorderMedia(
  weddingId: string,
  mediaId: string,
  direction: 'up' | 'down',
): Promise<Result> {
  const supabase = await ctx();

  const { data: current } = await supabase
    .from('invitation_media')
    .select('id, invitation_id, order_index')
    .eq('id', mediaId)
    .single();
  if (!current) return { error: 'Media tidak ditemukan.' };

  const { data: neighbour } = await supabase
    .from('invitation_media')
    .select('id, order_index')
    .eq('invitation_id', current.invitation_id)
    [direction === 'up' ? 'lt' : 'gt']('order_index', current.order_index)
    .order('order_index', { ascending: direction !== 'up' })
    .limit(1)
    .maybeSingle();

  if (!neighbour) return { message: 'Sudah di ujung.' };

  await supabase
    .from('invitation_media')
    .update({ order_index: neighbour.order_index })
    .eq('id', current.id);
  await supabase
    .from('invitation_media')
    .update({ order_index: current.order_index })
    .eq('id', neighbour.id);

  revalidatePath(`/dashboard/${weddingId}/builder`);
  return { message: 'Urutan diperbarui.' };
}
