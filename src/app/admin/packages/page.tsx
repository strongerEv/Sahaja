import { createClient } from '@/lib/supabase/server';
import PackageManager from '@/components/admin/PackageManager';
import { demoPackages, isDemoMode } from '@/lib/demo/data';
import type { Package } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminPackagesPage() {
  if (isDemoMode) return <PackageManager packages={demoPackages} />;

  const supabase = createClient();
  const { data } = await supabase.from('packages').select('*').order('price_idr');
  return <PackageManager packages={(data ?? []) as Package[]} />;
}
