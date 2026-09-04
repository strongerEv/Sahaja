'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import StepForm, { type StepSaveProps } from './StepForm';
import { randomSlug } from '@/lib/utils';
import { DEMO_NOTICE, isDemoMode } from '@/lib/demo/flag';
import type { Invitation } from '@/lib/types/database';

const LIBRARY = [
  { name: 'Tanpa musik', url: '' },
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
      description="Musik diputar setelah tamu menekan tombol buka undangan — browser memang tidak mengizinkan autoplay dengan suara."
      saving={saving}
      onSave={onSave}
    >
      <input type="hidden" name="music_url" value={url} />

      <div>
        <span className="label">Library bawaan</span>
        <div className="space-y-2">
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

      {url && (
        <div className="border-t border-line pt-5">
          <span className="label">Pratinjau</span>
          <audio src={url} controls className="w-full" />
          <p className="hint break-all">{url}</p>
        </div>
      )}
    </StepForm>
  );
}
