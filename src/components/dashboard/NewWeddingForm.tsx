'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import { createWedding, type ActionState } from '@/lib/actions/wedding';
import type { Template } from '@/lib/types/database';
import { cn } from '@/lib/utils';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? 'Membuat…' : 'Buat & lanjut ke builder'}
    </button>
  );
}

export default function NewWeddingForm({ templates }: { templates: Template[] }) {
  const [state, formAction] = useFormState<ActionState, FormData>(createWedding, null);
  const [selected, setSelected] = useState(templates[0]?.id ?? '');

  return (
    <form action={formAction} className="space-y-8">
      <div className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="groom_name">
              Nama panggilan mempelai pria
            </label>
            <input id="groom_name" name="groom_name" className="input" placeholder="Rizky" required />
          </div>
          <div>
            <label className="label" htmlFor="bride_name">
              Nama panggilan mempelai wanita
            </label>
            <input id="bride_name" name="bride_name" className="input" placeholder="Ayu" required />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="wedding_date">
            Tanggal pernikahan
          </label>
          <input id="wedding_date" name="wedding_date" type="date" className="input" />
          <p className="hint">Dipakai untuk hitung mundur otomatis. Bisa diisi belakangan.</p>
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl">Pilih template</h2>
        <input type="hidden" name="template_id" value={selected} />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => setSelected(template.id)}
              className={cn(
                'overflow-hidden rounded-2xl border-2 bg-white text-left transition',
                selected === template.id
                  ? 'border-brand-500 shadow-md'
                  : 'border-line hover:border-brand-200',
              )}
            >
              {template.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={template.thumbnail_url}
                  alt={template.name}
                  className="h-32 w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-32 w-full bg-brand-100" />
              )}
              <div className="p-3">
                <p className="text-sm font-medium">{template.name}</p>
                <p className="text-xs uppercase tracking-wider text-muted">{template.category}</p>
              </div>
            </button>
          ))}
        </div>
        {templates.length === 0 && (
          <p className="mt-4 rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
            Belum ada template. Jalankan seed Supabase (0004_seed.sql) lebih dulu.
          </p>
        )}
      </div>

      {state?.error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
