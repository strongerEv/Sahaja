'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveInvitationStep } from '@/lib/actions/invitation';
import { cn, invitationUrl, resolveSections } from '@/lib/utils';
import type {
  DigitalEnvelopeConfig,
  Invitation,
  InvitationMedia,
  Template,
} from '@/lib/types/database';
import StepTemplate from './StepTemplate';
import StepCouple from './StepCouple';
import StepEvents from './StepEvents';
import StepGallery from './StepGallery';
import StepStory from './StepStory';
import StepMusic from './StepMusic';
import StepTheme from './StepTheme';
import StepEnvelope from './StepEnvelope';
import StepPublish from './StepPublish';

const STEPS = [
  { key: 'template', label: 'Template' },
  { key: 'couple', label: 'Mempelai' },
  { key: 'events', label: 'Acara' },
  { key: 'gallery', label: 'Galeri' },
  { key: 'story', label: 'Cerita Cinta' },
  { key: 'music', label: 'Musik' },
  { key: 'theme', label: 'Tema' },
  { key: 'envelope', label: 'Amplop' },
  { key: 'publish', label: 'Publikasi' },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

export default function BuilderWizard({
  weddingId,
  invitation,
  templates,
  media,
  envelope,
}: {
  weddingId: string;
  invitation: Invitation;
  templates: Template[];
  media: InvitationMedia[];
  envelope: DigitalEnvelopeConfig | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<StepKey>('template');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const index = STEPS.findIndex((s) => s.key === step);
  const sections = resolveSections(invitation.sections_config_json);

  async function handleSave(formData: FormData, options?: { advance?: boolean }) {
    setSaving(true);
    setFeedback(null);
    const result = await saveInvitationStep(weddingId, invitation.id, step, formData);
    setSaving(false);

    if (result?.error) {
      setFeedback({ type: 'err', text: result.error });
      return;
    }
    setFeedback({ type: 'ok', text: result?.message ?? 'Tersimpan.' });
    router.refresh();

    if (options?.advance && index < STEPS.length - 1) {
      setStep(STEPS[index + 1].key);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const common = { saving, onSave: handleSave };

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside>
        <ol className="space-y-1">
          {STEPS.map((item, i) => (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => setStep(item.key)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition',
                  step === item.key
                    ? 'bg-brand-500 text-white'
                    : 'text-muted hover:bg-brand-50 hover:text-ink',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs',
                    step === item.key ? 'bg-white/20' : 'bg-cream',
                  )}
                >
                  {i + 1}
                </span>
                {item.label}
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-xl border border-line bg-white p-4 text-xs text-muted">
          <p className="font-medium text-ink">Link undangan</p>
          <p className="mt-1 break-all">{invitationUrl(invitation.slug)}</p>
          <Link
            href={`/u/${invitation.slug}?preview=1`}
            target="_blank"
            className="mt-3 inline-block text-brand-600 underline"
          >
            Buka pratinjau ↗
          </Link>
        </div>
      </aside>

      <section>
        {feedback && (
          <p
            role="status"
            className={cn(
              'mb-4 rounded-xl px-3.5 py-2.5 text-sm',
              feedback.type === 'ok'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700',
            )}
          >
            {feedback.text}
          </p>
        )}

        {step === 'template' && (
          <StepTemplate invitation={invitation} templates={templates} {...common} />
        )}
        {step === 'couple' && <StepCouple invitation={invitation} {...common} />}
        {step === 'events' && <StepEvents invitation={invitation} {...common} />}
        {step === 'gallery' && (
          <StepGallery weddingId={weddingId} invitation={invitation} media={media} />
        )}
        {step === 'story' && <StepStory invitation={invitation} {...common} />}
        {step === 'music' && <StepMusic invitation={invitation} {...common} />}
        {step === 'theme' && (
          <StepTheme invitation={invitation} sections={sections} {...common} />
        )}
        {step === 'envelope' && <StepEnvelope envelope={envelope} {...common} />}
        {step === 'publish' && (
          <StepPublish weddingId={weddingId} invitation={invitation} />
        )}
      </section>
    </div>
  );
}
