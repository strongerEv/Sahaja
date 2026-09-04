import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WeddingNav from '@/components/dashboard/WeddingNav';
import PublishToggle from '@/components/dashboard/PublishToggle';
import { formatShortDate } from '@/lib/format';

export default async function WeddingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { weddingId: string };
}) {
  const supabase = createClient();

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, groom_name, bride_name, wedding_date, invitations(id, slug, is_published)')
    .eq('id', params.weddingId)
    .maybeSingle();

  if (!wedding) notFound();

  const invitation = wedding.invitations?.[0] ?? null;

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
