import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import NewWeddingForm from '@/components/dashboard/NewWeddingForm';
import { demoTemplates, isDemoMode } from '@/lib/demo/data';
import type { Template } from '@/lib/types/database';

export const metadata = { title: 'Buat undangan' };
export const dynamic = 'force-dynamic';

async function loadTemplates(): Promise<Template[]> {
  if (isDemoMode) return demoTemplates;

  const supabase = createClient();
  const { data } = await supabase
    .from('templates')
    .select('*')
    .eq('is_active', true)
    .order('is_premium')
    .order('name');

  return (data ?? []) as Template[];
}

export default async function NewWeddingPage() {
  const templates = await loadTemplates();

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/dashboard" className="text-sm text-muted hover:text-ink">
        ← Kembali
      </Link>
      <h1 className="mt-3 font-display text-3xl">Buat undangan baru</h1>
      <p className="mt-1 text-sm text-muted">
        Data ini bisa diubah kapan saja di builder. Cukup isi yang penting dulu.
      </p>
      <div className="mt-8">
        <NewWeddingForm templates={templates} />
      </div>
    </main>
  );
}
