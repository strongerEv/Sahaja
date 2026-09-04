'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { randomSlug } from '@/lib/utils';
import { DEMO_NOTICE, isDemoMode } from '@/lib/demo/flag';

type Result = { error?: string; message?: string };

async function ctx() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return supabase;
}

export async function addGuest(weddingId: string, formData: FormData): Promise<Result> {
  if (isDemoMode) return { error: DEMO_NOTICE };

  const supabase = await ctx();

  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: 'Nama tamu wajib diisi.' };

  const { error } = await supabase.from('guests').insert({
    wedding_id: weddingId,
    name,
    category: String(formData.get('category') ?? 'umum').trim() || 'umum',
    phone: String(formData.get('phone') ?? '').trim() || null,
    unique_slug: randomSlug(8),
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${weddingId}/guests`);
  return { message: `${name} ditambahkan.` };
}

/** Import massal dari Excel/CSV. Slug unik digenerate per tamu. */
export async function importGuests(
  weddingId: string,
  rows: Array<{ name: string; category?: string; phone?: string }>,
): Promise<Result> {
  if (isDemoMode) return { error: DEMO_NOTICE };

  const supabase = await ctx();

  const clean = rows
    .map((row) => ({
      wedding_id: weddingId,
      name: row.name.trim().slice(0, 120),
      category: (row.category?.trim() || 'umum').slice(0, 40),
      phone: row.phone?.trim().slice(0, 30) || null,
      unique_slug: randomSlug(8),
    }))
    .filter((row) => row.name.length > 0)
    .slice(0, 2000);

  if (!clean.length) return { error: 'Tidak ada baris tamu yang bisa diimpor.' };

  // Insert bertahap supaya file besar tidak menabrak batas payload.
  for (let i = 0; i < clean.length; i += 200) {
    const { error } = await supabase.from('guests').insert(clean.slice(i, i + 200));
    if (error) return { error: error.message };
  }

  revalidatePath(`/dashboard/${weddingId}/guests`);
  return { message: `${clean.length} tamu berhasil diimpor.` };
}

export async function updateGuest(weddingId: string, guestId: string, formData: FormData): Promise<Result> {
  if (isDemoMode) return { error: DEMO_NOTICE };

  const supabase = await ctx();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: 'Nama tamu wajib diisi.' };

  const { error } = await supabase
    .from('guests')
    .update({
      name,
      category: String(formData.get('category') ?? 'umum').trim() || 'umum',
      phone: String(formData.get('phone') ?? '').trim() || null,
    })
    .eq('id', guestId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${weddingId}/guests`);
  return { message: 'Data tamu diperbarui.' };
}

export async function deleteGuest(weddingId: string, guestId: string): Promise<Result> {
  if (isDemoMode) return { error: DEMO_NOTICE };

  const supabase = await ctx();
  const { error } = await supabase.from('guests').delete().eq('id', guestId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${weddingId}/guests`);
  return { message: 'Tamu dihapus.' };
}

/** Ganti slug tamu — dipakai kalau link lama terlanjur tersebar ke orang lain. */
export async function regenerateGuestSlug(weddingId: string, guestId: string): Promise<Result> {
  if (isDemoMode) return { error: DEMO_NOTICE };

  const supabase = await ctx();
  const { error } = await supabase
    .from('guests')
    .update({ unique_slug: randomSlug(8) })
    .eq('id', guestId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${weddingId}/guests`);
  return { message: 'Link tamu diperbarui.' };
}

export async function toggleGuestbookVisibility(
  weddingId: string,
  entryId: string,
  hidden: boolean,
): Promise<Result> {
  if (isDemoMode) return { error: DEMO_NOTICE };

  const supabase = await ctx();
  const { error } = await supabase
    .from('guestbook_entries')
    .update({ is_hidden: hidden })
    .eq('id', entryId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${weddingId}/guestbook`);
  return { message: hidden ? 'Ucapan disembunyikan.' : 'Ucapan ditampilkan.' };
}

export async function deleteGuestbookEntry(weddingId: string, entryId: string): Promise<Result> {
  if (isDemoMode) return { error: DEMO_NOTICE };

  const supabase = await ctx();
  const { error } = await supabase.from('guestbook_entries').delete().eq('id', entryId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${weddingId}/guestbook`);
  return { message: 'Ucapan dihapus.' };
}
