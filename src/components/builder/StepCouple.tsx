'use client';

import StepForm, { type StepSaveProps } from './StepForm';
import type { Invitation } from '@/lib/types/database';

function Field({
  name,
  label,
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        className="input"
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
      />
    </div>
  );
}

export default function StepCouple({
  invitation,
  saving,
  onSave,
}: { invitation: Invitation } & StepSaveProps) {
  return (
    <StepForm
      title="Data mempelai"
      description="Nama panggilan tampil di sampul; nama lengkap dan nama orang tua tampil di bagian profil mempelai."
      saving={saving}
      onSave={onSave}
    >
      <fieldset className="space-y-4">
        <legend className="font-display text-xl text-brand-700">Mempelai Pria</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="groom_nickname" label="Nama panggilan" defaultValue={invitation.groom_nickname} placeholder="Rizky" />
          <Field name="groom_full_name" label="Nama lengkap" defaultValue={invitation.groom_full_name} placeholder="Rizky Pratama, S.T." />
          <Field name="groom_child_order" label="Anak ke-" defaultValue={invitation.groom_child_order} placeholder="Putra pertama" />
          <Field name="groom_father" label="Nama ayah" defaultValue={invitation.groom_father} placeholder="Bapak Suryanto" />
          <Field name="groom_mother" label="Nama ibu" defaultValue={invitation.groom_mother} placeholder="Ibu Suryani" />
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-line pt-5">
        <legend className="font-display text-xl text-brand-700">Mempelai Wanita</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="bride_nickname" label="Nama panggilan" defaultValue={invitation.bride_nickname} placeholder="Ayu" />
          <Field name="bride_full_name" label="Nama lengkap" defaultValue={invitation.bride_full_name} placeholder="Ayu Lestari, S.Pd." />
          <Field name="bride_child_order" label="Anak ke-" defaultValue={invitation.bride_child_order} placeholder="Putri kedua" />
          <Field name="bride_father" label="Nama ayah" defaultValue={invitation.bride_father} placeholder="Bapak Hartono" />
          <Field name="bride_mother" label="Nama ibu" defaultValue={invitation.bride_mother} placeholder="Ibu Marlina" />
        </div>
      </fieldset>

      <div className="border-t border-line pt-5">
        <label className="label" htmlFor="quote_text">
          Kutipan pembuka (opsional)
        </label>
        <textarea
          id="quote_text"
          name="quote_text"
          rows={3}
          className="input"
          defaultValue={invitation.quote_text ?? ''}
          placeholder="Dan di antara tanda-tanda kekuasaan-Nya diciptakan-Nya untukmu pasangan hidup…"
        />
        <p className="hint">Muncul di bawah nama mempelai pada halaman undangan.</p>
      </div>
    </StepForm>
  );
}
