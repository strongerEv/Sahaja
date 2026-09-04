'use client';

import { useEffect, useRef, useState } from 'react';
import { createPublicClient } from '@/lib/supabase/public';
import { getDictionary } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type {
  DigitalEnvelopeConfig,
  GuestbookEntry,
  Invitation,
  InvitationMedia,
  SectionsConfig,
} from '@/lib/types/database';
import Cover from './Cover';
import {
  ClosingSection,
  CoupleSection,
  CountdownSection,
  EventsSection,
  GallerySection,
  HeroSection,
  LoveStorySection,
} from './Sections';
import RsvpSection from './RsvpSection';
import GuestbookSection from './GuestbookSection';
import EnvelopeSection from './EnvelopeSection';

export default function InvitationView({
  invitation,
  sections,
  media,
  envelope,
  entries,
  guest,
  guestSlug,
  preview,
}: {
  invitation: Invitation;
  sections: SectionsConfig;
  media: InvitationMedia[];
  envelope: DigitalEnvelopeConfig | null;
  entries: GuestbookEntry[];
  guest: { id: string; name: string } | null;
  guestSlug: string | null;
  preview: boolean;
}) {
  const dict = getDictionary(invitation.language);
  const [opened, setOpened] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const tracked = useRef(false);

  // Catat kunjungan sekali per pemuatan halaman, hanya untuk undangan live.
  useEffect(() => {
    if (!opened || tracked.current || preview) return;
    tracked.current = true;

    const supabase = createPublicClient();
    void supabase.rpc('register_invitation_visit', {
      p_invitation_slug: invitation.slug,
      p_guest_slug: guestSlug,
      p_referrer: document.referrer || null,
      p_user_agent: navigator.userAgent,
    });
  }, [opened, preview, invitation.slug, guestSlug]);

  // Animasi masuk tiap section saat masuk viewport.
  useEffect(() => {
    if (!opened) return;
    const items = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          if (record.isIntersecting) {
            record.target.classList.add('is-visible');
            observer.unobserve(record.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [opened]);

  function handleOpen() {
    setOpened(true);
    document.body.style.overflow = '';
    if (invitation.music_url && audioRef.current) {
      audioRef.current.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    }
  }

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().then(() => setPlaying(true));
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  const coverImage = invitation.cover_image_url ?? media.find((m) => m.type === 'photo')?.url ?? null;

  const nodes: Record<string, React.ReactNode> = {
    hero: <HeroSection key="hero" invitation={invitation} dict={dict} coverImage={coverImage} />,
    couple: <CoupleSection key="couple" invitation={invitation} dict={dict} />,
    countdown: <CountdownSection key="countdown" invitation={invitation} dict={dict} />,
    events: <EventsSection key="events" invitation={invitation} dict={dict} />,
    gallery: <GallerySection key="gallery" media={media} dict={dict} />,
    love_story: <LoveStorySection key="love_story" invitation={invitation} dict={dict} />,
    rsvp: (
      <RsvpSection
        key="rsvp"
        dict={dict}
        invitationSlug={invitation.slug}
        guestSlug={guestSlug}
        guestName={guest?.name ?? null}
        disabled={preview}
      />
    ),
    guestbook: (
      <GuestbookSection
        key="guestbook"
        dict={dict}
        invitationSlug={invitation.slug}
        guestSlug={guestSlug}
        guestName={guest?.name ?? null}
        initialEntries={entries}
        disabled={preview}
      />
    ),
    envelope: <EnvelopeSection key="envelope" envelope={envelope} dict={dict} />,
    closing: <ClosingSection key="closing" invitation={invitation} dict={dict} />,
  };

  return (
    <div
      className={cn(
        'invitation-scope min-h-screen bg-cream',
        invitation.font === 'body' ? 'font-body' : 'font-display',
      )}
      style={{ ['--invitation-theme' as string]: invitation.theme_color }}
    >
      {preview && (
        <p className="sticky top-0 z-50 bg-amber-400 px-4 py-2 text-center text-xs font-medium text-amber-950">
          {dict.draftBanner}
        </p>
      )}

      {!opened ? (
        <Cover
          invitation={invitation}
          dict={dict}
          guestName={guest?.name ?? null}
          coverImage={coverImage}
          onOpen={handleOpen}
        />
      ) : (
        <main className="animate-fade-up">
          {sections.order
            .filter((key) => sections[key])
            .map((key) => nodes[key])
            .filter(Boolean)}

          <footer className="border-t border-line py-8 text-center text-xs text-muted">
            <p>
              {dict.madeWith} ♥ ·{' '}
              <a href="/" className="underline">
                Sahaja
              </a>
            </p>
          </footer>
        </main>
      )}

      {invitation.music_url && (
        <>
          <audio ref={audioRef} src={invitation.music_url} loop preload="none" />
          {opened && (
            <button
              type="button"
              onClick={toggleMusic}
              aria-label={playing ? dict.musicOn : dict.musicOff}
              className="theme-bg fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg"
            >
              {playing ? '❚❚' : '♪'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
