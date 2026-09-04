'use client';

import { useState } from 'react';
import StepForm, { type StepSaveProps } from './StepForm';
import { SECTION_LABELS } from '@/lib/utils';
import type { Invitation, SectionKey, SectionsConfig } from '@/lib/types/database';

const PALETTE = ['#A6753F', '#B87A7A', '#1F6F5C', '#3F3A36', '#7B4B2A', '#4A6FA5', '#8E7CC3'];

/** Section wajib tampil — mematikannya bikin undangan kehilangan konteks. */
const LOCKED: SectionKey[] = ['hero'];

export default function StepTheme({
  invitation,
  sections,
  saving,
  onSave,
}: { invitation: Invitation; sections: SectionsConfig } & StepSaveProps) {
  const [color, setColor] = useState(invitation.theme_color);
  const [config, setConfig] = useState<SectionsConfig>(sections);

  function toggle(key: SectionKey) {
    if (LOCKED.includes(key)) return;
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function move(index: number, direction: -1 | 1) {
    setConfig((prev) => {
      const order = [...prev.order];
      const target = index + direction;
      if (target < 0 || target >= order.length) return prev;
      [order[index], order[target]] = [order[target], order[index]];
      return { ...prev, order };
    });
  }

  return (
    <StepForm
      title="Tema & susunan section"
      description="Atur warna, font, dan section mana yang tampil beserta urutannya."
      saving={saving}
      onSave={onSave}
    >
      <input type="hidden" name="sections_config_json" value={JSON.stringify(config)} />
      <input type="hidden" name="theme_color" value={color} />

      <div>
        <span className="label">Warna tema</span>
        <div className="flex flex-wrap items-center gap-2">
          {PALETTE.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => setColor(hex)}
              style={{ backgroundColor: hex }}
              aria-label={`Warna ${hex}`}
              className={
                color.toLowerCase() === hex.toLowerCase()
                  ? 'h-9 w-9 rounded-full ring-2 ring-ink ring-offset-2'
                  : 'h-9 w-9 rounded-full'
              }
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-9 w-14 cursor-pointer rounded border border-line bg-white"
            aria-label="Warna kustom"
          />
          <code className="text-xs text-muted">{color}</code>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="font">
            Gaya font
          </label>
          <select id="font" name="font" className="input" defaultValue={invitation.font}>
            <option value="display">Serif klasik (Cormorant)</option>
            <option value="body">Sans-serif modern (Inter)</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="cover_image_url">
            URL foto sampul (opsional)
          </label>
          <input
            id="cover_image_url"
            name="cover_image_url"
            type="url"
            className="input"
            defaultValue={invitation.cover_image_url ?? ''}
            placeholder="https://…"
          />
          <p className="hint">Kosongkan untuk memakai foto pertama dari galeri.</p>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="closing_text">
          Kalimat penutup
        </label>
        <textarea
          id="closing_text"
          name="closing_text"
          rows={3}
          className="input"
          defaultValue={invitation.closing_text ?? ''}
          placeholder="Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir."
        />
      </div>

      <div className="border-t border-line pt-5">
        <span className="label">Section undangan</span>
        <p className="hint mb-3">
          Matikan yang tidak dipakai, dan susun urutannya sesuai alur cerita Anda.
        </p>
        <ol className="space-y-2">
          {config.order.map((key, index) => (
            <li
              key={key}
              className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5"
            >
              <label className="flex flex-1 cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(config[key])}
                  onChange={() => toggle(key)}
                  disabled={LOCKED.includes(key)}
                  className="accent-brand-500"
                />
                <span className={config[key] ? '' : 'text-muted line-through'}>
                  {SECTION_LABELS[key]}
                </span>
                {LOCKED.includes(key) && <span className="text-xs text-muted">(wajib)</span>}
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="btn-ghost btn-sm px-2"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Naikkan ${SECTION_LABELS[key]}`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-sm px-2"
                  onClick={() => move(index, 1)}
                  disabled={index === config.order.length - 1}
                  aria-label={`Turunkan ${SECTION_LABELS[key]}`}
                >
                  ↓
                </button>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </StepForm>
  );
}
