'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTemplate, saveTemplate } from '@/lib/actions/admin';
import type { Template } from '@/lib/types/database';

const CATEGORIES = ['elegant', 'floral', 'minimalis', 'islami', 'adat', 'modern'];

export default function TemplateManager({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const active = editing ?? null;
  const showForm = creating || Boolean(editing);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveTemplate(active?.id ?? null, formData);
      setFeedback(
        result?.error
          ? { type: 'err', text: result.error }
          : { type: 'ok', text: result?.message ?? 'Tersimpan.' },
      );
      if (!result?.error) {
        setEditing(null);
        setCreating(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <p
          className={
            feedback.type === 'ok'
              ? 'rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700'
              : 'rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700'
          }
        >
          {feedback.text}
        </p>
      )}

      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Template desain</h1>
        <button
          type="button"
          className="btn-primary btn-sm"
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
        >
          + Template baru
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="card space-y-4" key={active?.id ?? 'new'}>
          <h2 className="font-display text-xl">
            {active ? `Edit: ${active.name}` : 'Template baru'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">Nama</label>
              <input id="name" name="name" className="input" defaultValue={active?.name ?? ''} required />
            </div>
            <div>
              <label className="label" htmlFor="slug">Slug</label>
              <input id="slug" name="slug" className="input" defaultValue={active?.slug ?? ''} placeholder="otomatis dari nama" />
            </div>
            <div>
              <label className="label" htmlFor="category">Kategori</label>
              <select id="category" name="category" className="input" defaultValue={active?.category ?? 'elegant'}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="thumbnail_url">URL thumbnail</label>
              <input id="thumbnail_url" name="thumbnail_url" type="url" className="input" defaultValue={active?.thumbnail_url ?? ''} />
            </div>
            <div>
              <label className="label" htmlFor="theme_color">Warna default</label>
              <input id="theme_color" name="theme_color" type="color" className="input h-11" defaultValue={active?.default_config?.theme_color ?? '#A6753F'} />
            </div>
            <div>
              <label className="label" htmlFor="font">Font default</label>
              <select id="font" name="font" className="input" defaultValue={active?.default_config?.font ?? 'display'}>
                <option value="display">Serif klasik</option>
                <option value="body">Sans-serif modern</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="description">Deskripsi</label>
            <textarea id="description" name="description" rows={2} className="input" defaultValue={active?.description ?? ''} />
          </div>
          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="is_premium" defaultChecked={active?.is_premium ?? false} className="accent-brand-500" />
              Template premium
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="is_active" defaultChecked={active?.is_active ?? true} className="accent-brand-500" />
              Aktif
            </label>
          </div>
          <div className="flex gap-2 border-t border-line pt-4">
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? 'Menyimpan…' : 'Simpan'}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setEditing(null);
                setCreating(false);
              }}
            >
              Batal
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div key={template.id} className="card">
            {template.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={template.thumbnail_url}
                alt={template.name}
                className="-mx-5 -mt-5 mb-4 h-32 w-[calc(100%+2.5rem)] object-cover"
                loading="lazy"
              />
            )}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-xl">{template.name}</h3>
                <p className="text-xs uppercase tracking-wider text-muted">{template.category}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {template.is_premium && <span className="badge bg-brand-100 text-brand-700">Premium</span>}
                {!template.is_active && <span className="badge bg-cream text-muted">Nonaktif</span>}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => {
                  setCreating(false);
                  setEditing(template);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn-ghost btn-sm text-red-600"
                disabled={pending}
                onClick={() => {
                  if (confirm(`Hapus template "${template.name}"?`)) {
                    startTransition(async () => {
                      const result = await deleteTemplate(template.id);
                      if (result?.error) setFeedback({ type: 'err', text: result.error });
                      else router.refresh();
                    });
                  }
                }}
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
