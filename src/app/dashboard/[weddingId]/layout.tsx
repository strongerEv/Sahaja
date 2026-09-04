import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WeddingNav from '@/components/dashboard/WeddingNav';
import PublishToggle from '@/components/dashboard/PublishToggle';
import { formatShortDate } from '@/lib/format';
import { demoInvitation, demoWedding, isDemoMode } from '@/lib/demo/data';

type HeaderWedding = {
  id: string;
  groom_name: string;
  bride_name: string;
  wedding_date: string | null;
};

type HeaderInvitation = { id: string; slug: string; is_published: boolean };

async function loadWedding(weddingId: string): Promise<{
  wedding: HeaderWedding | null;
  invitation: HeaderInvitation | null;
}> {
  if (isDemoMode) {
    return {
      wedding: demoWedding,
      invitation: {
        id: demoInvitation.id,
        slug: demoInvitation.slug,
        is_published: demoInvitation.is_published,
      },
    };
  }

  const supabase = createClient();
  const { data } = await supabase
    .from('weddings')
    .select('id, groom_name, bride_name, wedding_date, invitations(id, slug, is_published)')
    .eq('id', weddingId)
    .maybeSingle();

  return { wedding: data ?? null, invitation: data?.invitations?.[0] ?? null };
}

export default async function WeddingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { weddingId: string };
}) {
  const { wedding, invitation } = await loadWedding(params.weddingId);
  if (!wedding) notFound();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <Link href="/dashboard" className="text-sm text-muted hover:text-ink">
        ← Semua undangan
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">
            {wedding.groom_name} &amp; {wedding.bride_name}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {wedding.wedding_date ? formatShortDate(wedding.wedding_date) : 'Tanggal belum diisi'}
            {invitation ? ` · /u/${invitation.slug}` : ''}
          </p>
        </div>
        {invitation && (
          <div className="flex items-center gap-2">
            <Link
              href={`/u/${invitation.slug}?preview=1`}
              target="_blank"
              className="btn-ghost btn-sm"
            >
              Pratinjau
            </Link>
            <PublishToggle
              weddingId={wedding.id}
              invitationId={invitation.id}
              isPublished={invitation.is_published}
            />
          </div>
        )}
      </div>

      <WeddingNav weddingId={params.weddingId} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
