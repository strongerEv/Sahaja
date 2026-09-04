'use client';

import { useState } from 'react';
import StepForm, { type StepSaveProps } from './StepForm';
import { cn } from '@/lib/utils';
import type { Invitation, Template } from '@/lib/types/database';

export default function StepTemplate({
  invitation,
  templates,
  saving,
  onSave,
}: { invitation: Invitation; templates: Template[] } & StepSaveProps) {
  const [selected, setSelected] = useState(invitation.template_id ?? '');
  const categories = Array.from(new Set(templates.map((t) => t.category)));
  const [filter, setFilter] = useState<string>('semua');

  const visible = filter === 'semua' ? templates : templates.filter((t) => t.category === filter);

  return (
    <StepForm
      title="Pilih template desain"
      description="Template menentukan gaya dasar. Warna, font, dan susunan section masih bisa diubah di langkah Tema."
      saving={saving}
      onSave={onSave}
    >
      <input type="hidden" name="template_id" value={selected} />

      <div className="flex flex-wrap gap-2">
        {['semua', ...categories].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs capitalize transition',
              filter === cat ? 'bg-brand-500 text-white' : 'bg-cream text-muted hover:text-ink',
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((template) => (
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
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{template.name}</p>
                {template.is_premium && (
                  <span className="badge bg-brand-100 text-[10px] text-brand-700">Premium</span>
                )}
              </div>
              <p className="text-xs uppercase tracking-wider text-muted">{template.category}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="max-w-xs">
        <label className="label" htmlFor="language">
          Bahasa undangan
        </label>
        <select
          id="language"
          name="language"
          className="input"
          defaultValue={invitation.language}
        >
          <option value="id">Bahasa Indonesia</option>
          <option value="en">English</option>
        </select>
      </div>
    </StepForm>
  );
}
