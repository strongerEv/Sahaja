'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DEMO_NOTICE, isDemoMode } from '@/lib/demo/data';

type Result = { error?: string; message?: string };

/** Semua aksi di sini bergantung pada RLS `is_platform_admin()` di database. */
async function adminClient() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role_platform')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role_platform !== 'platform_admin') {
    throw new Error('Hanya admin platform yang boleh melakukan aksi ini.');
  }
  return supabase;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export async function saveTemplate(templateId: string | null, formData: FormData): Promise<Result> {
  if (isDemoMode) return { error: DEMO_NOTICE };

  const supabase = await adminClient();

  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: 'Nama template wajib diisi.' };

  const payload = {
    name,
    slug: String(formData.get('slug') ?? '').trim() || slugify(name),
    category: String(formData.get('category') ?? 'elegant').trim(),
    description: String(formData.get('description') ?? '').trim() || null,
    thumbnail_url: String(formData.get('thumbnail_url') ?? '').trim() || null,
    default_config: {
      theme_color: String(formData.get('theme_color') ?? '#A6753F'),
      font: String(formData.get('font') ?? 'display'),
    },
    is_premium: formData.get('is_premium') === 'on',
    is_active: formData.get('is_active') === 'on',
  };

  const { error } = templateId
    ? await supabase.from('templates').update(payload).eq('id', templateId)
    : await supabase.from('templates').insert(payload);

  if (error) return { error: error.message };
  revalidatePath('/admin/templates');
  return { message: templateId ? 'Template diperbarui.' : 'Template ditambahkan.' };
}

export async function deleteTemplate(templateId: string): Promise<Result> {
  if (isDemoMode) return { error: DEMO_NOTICE };

  const supabase = await adminClient();
  const { error } = await supabase.from('templates').delete().eq('id', templateId);
  if (error) return { error: error.message };
  revalidatePath('/admin/templates');
  return { message: 'Template dihapus.' };
}

export async function savePackage(packageId: string | null, formData: FormData): Promise<Result> {
  if (isDemoMode) return { error: DEMO_NOTICE };

  const supabase = await adminClient();

  const name = String(formData.get('name') ?? '').trim();
  const code = String(formData.get('code') ?? '').trim();
  if (!name || !code) return { error: 'Kode dan nama paket wajib diisi.' };

  const maxGuests = String(formData.get('max_guests') ?? '').trim();
  const features = String(formData.get('features') ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const payload = {
    code,
    name,
    price_idr: Number(formData.get('price_idr') ?? 0) || 0,
    features_json: features,
    max_guests: maxGuests === '' ? null : Number(maxGuests),
    has_watermark: formData.get('has_watermark') === 'on',
    custom_domain: formData.get('custom_domain') === 'on',
    is_active: formData.get('is_active') === 'on',
  };

  const { error } = packageId
    ? await supabase.from('packages').update(payload).eq('id', packageId)
    : await supabase.from('packages').insert(payload);

  if (error) return { error: error.message };
  revalidatePath('/admin/packages');
  return { message: packageId ? 'Paket diperbarui.' : 'Paket ditambahkan.' };
}
