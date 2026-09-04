'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { addMedia, deleteMedia, reorderMedia } from '@/lib/actions/invitation';
import { cn, randomSlug } from '@/lib/utils';
import { DEMO_NOTICE, isDemoMode } from '@/lib/demo/flag';
import type { Invitation, InvitationMedia } from '@/lib/types/database';

const BUCKET = 'invitation-media';
const MAX_BYTES = 15 * 1024 * 1024;

export default function StepGallery({
  weddingId,
  invitation,
  media,
}: {
  weddingId: string;
  invitation: Invitation;
  media: InvitationMedia[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function upload(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;

    setError(null);

    if (isDemoMode) {
      setError(`${DEMO_NOTICE} Unggah media membutuhkan Supabase Storage.`);
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const uploaded: Array<{ url: string; type: 'photo' | 'video' }> = [];

    try {
      for (let i = 0; i < list.length; i += 1) {
        const file = list[i];
        setProgress(`Mengunggah ${i + 1}/${list.length}: ${file.name}`);

        if (file.size > MAX_BYTES) {
          setError(`"${file.name}" lebih dari 15 MB dan dilewati.`);
          continue;
        }
        const isVideo = file.type.startsWith('video/');
        if (!isVideo && !file.type.startsWith('image/')) {
          setError(`"${file.name}" bukan foto atau video dan dilewati.`);
          continue;
        }

        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
        // Path diawali wedding_id — dipakai policy storage untuk cek keanggotaan.
        const path = `${weddingId}/${randomSlug(10)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { cacheControl: '31536000', upsert: false });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        uploaded.push({ url: data.publicUrl, type: isVideo ? 'video' : 'photo' });
      }

      if (uploaded.length) {
        const result = await addMedia(weddingId, invitation.id, uploaded);
        if (result?.error) setError(result.error);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah media.');
    } finally {
      setUploading(false);
      setProgress('');
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function remove(mediaId: string) {
    startTransition(async () => {
      await deleteMedia(weddingId, mediaId);
      router.refresh();
    });
  }

  function move(mediaId: string, direction: 'up' | 'down') {
    startTransition(async () => {
      await reorderMedia(weddingId, mediaId, direction);
      router.refresh();
    });
  }

  return (
    <div className="card space-y-5">
      <header>
        <h2 className="font-display text-2xl">Galeri foto &amp; video</h2>
        <p className="mt-1 text-sm text-muted">
          Seret file ke area di bawah atau pilih dari perangkat. Urutan di sini = urutan tampil di
          undangan.
        </p>
      </header>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void upload(e.dataTransfer.files);
        }}
        className={cn(
          'rounded-2xl border-2 border-dashed p-10 text-center transition',
          dragging ? 'border-brand-400 bg-brand-50' : 'border-line bg-cream/50',
        )}
      >
        <p className="text-sm text-muted">Tarik & lepas foto/video di sini</p>
        <p className="my-2 text-xs text-muted">atau</p>
        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          Pilih file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(e) => e.target.files && void upload(e.target.files)}
        />
        <p className="hint mt-3">Maksimal 15 MB per file.</p>
      </div>

      {uploading && (
        <p className="rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-700">{progress}</p>
      )}
      {error && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}

      {media.length === 0 ? (
        <p className="text-sm text-muted">Belum ada media.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-3">
          {media.map((item, i) => (
            <li key={item.id} className="overflow-hidden rounded-xl border border-line bg-white">
              {item.type === 'video' ? (
                <video src={item.url} className="h-36 w-full object-cover" controls muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="" className="h-36 w-full object-cover" loading="lazy" />
              )}
              <div className="flex items-center justify-between gap-1 p-2">
                <span className="text-xs text-muted">#{i + 1}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="btn-ghost btn-sm px-2"
                    onClick={() => move(item.id, 'up')}
                    disabled={pending || i === 0}
                    aria-label="Naikkan urutan"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm px-2"
                    onClick={() => move(item.id, 'down')}
                    disabled={pending || i === media.length - 1}
                    aria-label="Turunkan urutan"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm px-2 text-red-600"
                    onClick={() => remove(item.id)}
                    disabled={pending}
                    aria-label="Hapus media"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
