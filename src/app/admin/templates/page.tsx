import { createClient } from '@/lib/supabase/server';
import TemplateManager from '@/components/admin/TemplateManager';
import { demoTemplates, isDemoMode } from '@/lib/demo/data';
import type { Template } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminTemplatesPage() {
  if (isDemoMode) return <TemplateManager templates={demoTemplates} />;

  const supabase = createClient();
  const { data } = await supabase.from('templates').select('*').order('name');
  return <TemplateManager templates={(data ?? []) as Template[]} />;
}
