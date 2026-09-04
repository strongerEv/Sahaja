'use client';

import { useState } from 'react';
import StepForm, { type StepSaveProps } from './StepForm';
import type { Invitation, LoveStoryItem } from '@/lib/types/database';

export default function StepStory({
  invitation,
  saving,
  onSave,
}: { invitation: Invitation } & StepSaveProps) {
  const [items, setItems] = useState<LoveStoryItem[]>(
    Array.isArray(invitation.love_story_json) ? invitation.love_story_json : [],
  );

  function update(index: number, patch: Partial<LoveStoryItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <StepForm
      title="Cerita cinta"
      description="Opsional. Ditampilkan sebagai timeline — kosongkan kalau tidak ingin dipakai."
      saving={saving}
      onSave={onSave}
    >
      <input type="hidden" name="love_story_json" value={JSON.stringify(items)} />

      {items.length === 0 && (
        <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
          Belum ada momen. Tambahkan momen pertama, misalnya &ldquo;Pertama bertemu&rdquo;.
        </p>
      )}

      <ol className="space-y-4">
        {items.map((item, index) => (
          <li key={index} className="rounded-xl border border-line p-4">
            <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
              <div>
                <label className="label">Tanggal</label>
                <input
                  type="date"
                  className="input"
                  value={item.date ?? ''}
                  onChange={(e) => update(index, { date: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Judul momen</label>
                <input
                  className="input"
                  value={item.title ?? ''}
                  onChange={(e) => update(index, { title: e.target.value })}
                  placeholder="Pertama bertemu"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="label">Cerita</label>
              <textarea
                rows={3}
                className="input"
                value={item.description ?? ''}
                onChange={(e) => update(index, { description: e.target.value })}
                placeholder="Kami dikenalkan oleh teman kuliah di sebuah acara…"
              />
            </div>
            <button
              type="button"
              className="btn-ghost btn-sm mt-3 text-red-600"
              onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
            >
              Hapus momen
            </button>
          </li>
        ))}
      </ol>

      <button
        type="button"
        className="btn-ghost"
        onClick={() =>
          setItems((prev) => [...prev, { date: '', title: '', description: '' }])
        }
      >
        + Tambah momen
      </button>
    </StepForm>
  );
}
