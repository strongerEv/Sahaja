'use client';

import { useEffect, useRef } from 'react';
import type { MusicSource } from '@/lib/music';

/** Bagian kecil IFrame Player API yang benar-benar dipakai di sini. */
interface YouTubePlayer {
  playVideo?: () => void;
  pauseVideo?: () => void;
  destroy?: () => void;
}

interface YouTubeApi {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars: Record<string, string | number>;
      events: {
        onReady: (event: { target: YouTubePlayer }) => void;
        onError: () => void;
      };
    },
  ) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YouTubeApi> | null = null;

/** Memuat IFrame Player API sekali saja, walau ada beberapa pemanggil. */
function loadYouTubeApi(): Promise<YouTubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT as YouTubeApi);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => reject(new Error('Gagal memuat pemutar YouTube'));
    document.body.appendChild(script);
  });

  return apiPromise;
}

/**
 * Musik latar undangan, dari berkas audio maupun video YouTube.
 *
 * Pemutaran selalu menyusul sentuhan tamu pada tombol "Buka Undangan";
 * browser memblokir suara yang menyala tanpa interaksi. Bila tetap diblokir,
 * `onBlocked` mengembalikan tombol musik ke keadaan mati supaya tamu bisa
 * menyalakannya sendiri.
 */
export default function BackgroundMusic({
  source,
  playing,
  onBlocked,
}: {
  source: MusicSource;
  playing: boolean;
  onBlocked: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const wantPlayingRef = useRef(playing);

  wantPlayingRef.current = playing;

  // --- berkas audio langsung ---
  useEffect(() => {
    if (source?.kind !== 'audio') return;
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.play().catch(onBlocked);
    } else {
      audio.pause();
    }
  }, [source, playing, onBlocked]);

  // --- YouTube ---
  useEffect(() => {
    if (source?.kind !== 'youtube' || !mountRef.current) return;

    let cancelled = false;
    const container = mountRef.current;

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        playerRef.current = new YT.Player(container, {
          videoId: source.videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            // Satu video yang diulang terus perlu playlist berisi dirinya sendiri.
            loop: 1,
            playlist: source.videoId,
          },
          events: {
            onReady: (event: { target: YouTubePlayer }) => {
              if (cancelled) return;
              if (wantPlayingRef.current) event.target.playVideo?.();
            },
            onError: onBlocked,
          },
        });
      })
      .catch(onBlocked);

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [source, onBlocked]);

  useEffect(() => {
    if (source?.kind !== 'youtube') return;
    const player = playerRef.current;
    if (!player) return;

    if (playing) player.playVideo?.();
    else player.pauseVideo?.();
  }, [source, playing]);

  if (!source) return null;

  if (source.kind === 'audio') {
    return <audio ref={audioRef} src={source.url} loop preload="none" />;
  }

  // Pemutar YouTube tetap dirender — iframe yang disembunyikan dengan
  // display:none tidak diizinkan memutar suara oleh sebagian browser.
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed bottom-0 right-0 h-px w-px overflow-hidden opacity-[0.01]"
    >
      <div ref={mountRef} />
    </div>
  );
}
