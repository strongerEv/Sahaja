'use client';

import { useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import StepForm, { type StepSaveProps } from './StepForm';
import { randomSlug } from '@/lib/utils';
import { describeMusicSource, parseMusicUrl } from '@/lib/music';
import { DEMO_NOTICE, isDemoMode } from '@/lib/demo/flag';
import type { Invitation } from '@/lib/types/database';

const LIBRARY = [
  {
    name: 'Canon in D — Pachelbel',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Canon_in_D_Major_-_Pachelbel%27s_Canon.ogg',
  },
  {
    name: 'Clair de Lune — Debussy',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/31/Debussy_-_Clair_de_Lune.ogg',
  },
  {
    name: 'Air on the G String — Bach',
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Air_on_the_G_String.ogg',
  },
];

export default function StepMusic({
  invitation,
  saving,
  onSave,
}: { invitation: Invitation } & StepSaveProps) {
  const [url, setUrl] = useState(invitation.music_url ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const source = useMemo(() => parseMusicUrl(url), [url]);
  const linkInvalid = url.trim().length > 0 && source === null;

  async function uploadAudio(file: File) {
    setError(null);

    if (isDemoMode) {
      setError(`${DEMO_NOTICE} Unggah audio membutuhkan Supabase Storage.`);
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp3';
      const path = `${invitation.wedding_id}/audio-${randomSlug(8)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('invitation-media')
        .upload(path, file, { cacheControl: '31536000' });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('invitation-media').getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah audio.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <StepForm
      title="Musik latar"
      description="Musik menyala begitu tamu menekan tombol Buka Undangan. Browser memang tidak mengizinkan suara menyala sebelum tamu menyentuh layar."
      saving={saving}
      onSave={onSave}
    >
      <input type="hidden" name="music_url" value={source ? url.trim() : ''} />

      <div>
        <label className="label" htmlFor="music_link">
          Tempel tautan lagu
        </label>
        <input
          id="music_link"
          type="url"
          className="input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtu.be/… atau https://…/lagu.mp3"
        />
        <p className={linkInvalid ? 'mt-1 text-xs text-red-700' : 'hint'}>
          {linkInvalid
            ? 'Tautan tidak dikenali. Pakai tautan video YouTube, atau tautan langsung ke berkas audio.'
            : describeMusicSource(source)}
        </p>
        <p className="hint">
          YouTube paling praktis: cukup salin tautan videonya, tidak perlu punya berkas lagunya.
        </p>
      </div>

      <div className="border-t border-line pt-5">
        <span className="label">Atau pilih dari library</span>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-3.5 py-2.5 text-sm hover:border-brand-300">
            <input
              type="radio"
              name="music_choice"
              checked={url.trim() === ''}
              onChange={() => setUrl('')}
              className="accent-brand-500"
            />
            Tanpa musik
          </label>
          {LIBRARY.map((track) => (
            <label
              key={track.name}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-3.5 py-2.5 text-sm hover:border-brand-300"
            >
              <input
                type="radio"
                name="music_choice"
                checked={url === track.url}
                onChange={() => setUrl(track.url)}
                className="accent-brand-500"
              />
              {track.name}
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <span className="label">Atau unggah lagu sendiri</span>
        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Mengunggah…' : 'Pilih file audio'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          hidden
          onChange={(e) => e.target.files?.[0] && void uploadAudio(e.target.files[0])}
        />
        <p className="hint">Pastikan Anda punya hak pakai atas lagu yang diunggah.</p>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}

      {source?.kind === 'audio' && (
        <div className="border-t border-line pt-5">
          <span className="label">Pratinjau</span>
          <audio src={source.url} controls className="w-full" />
        </div>
      )}

      {source?.kind === 'youtube' && (
        <div className="border-t border-line pt-5">
          <span className="label">Pratinjau</span>
          <div className="overflow-hidden rounded-xl border border-line">
            <iframe
              title="Pratinjau musik"
              src={`https://www.youtube.com/embed/${source.videoId}`}
              className="aspect-video w-full"
              allow="encrypted-media"
              allowFullScreen
            />
          </div>
          <p className="hint">
            Di halaman undangan, videonya tidak ditampilkan — hanya suaranya yang diputar.
          </p>
        </div>
      )}
    </StepForm>
  );
}
