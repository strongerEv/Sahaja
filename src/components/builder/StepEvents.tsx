'use client';

import StepForm, { type StepSaveProps } from './StepForm';
import { toDatetimeLocal } from '@/lib/format';
import type { Invitation } from '@/lib/types/database';

function EventFields({
  prefix,
  legend,
  invitation,
}: {
  prefix: 'akad' | 'resepsi';
  legend: string;
  invitation: Invitation;
}) {
  const dt = prefix === 'akad' ? invitation.akad_datetime : invitation.resepsi_datetime;
  const location = prefix === 'akad' ? invitation.akad_location : invitation.resepsi_location;
  const address = prefix === 'akad' ? invitation.akad_address : invitation.resepsi_address;
  const maps = prefix === 'akad' ? invitation.akad_maps_url : invitation.resepsi_maps_url;

  return (
    <fieldset className="space-y-4">
      <legend className="font-display text-xl text-brand-700">{legend}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${prefix}_datetime`}>
            Tanggal &amp; jam
          </label>
          <input
            id={`${prefix}_datetime`}
            name={`${prefix}_datetime`}
            type="datetime-local"
            className="input"
            defaultValue={toDatetimeLocal(dt)}
          />
          <p className="hint">Waktu Indonesia Barat (WIB).</p>
        </div>
        <div>
          <label className="label" htmlFor={`${prefix}_location`}>
            Nama tempat
          </label>
          <input
            id={`${prefix}_location`}
            name={`${prefix}_location`}
            className="input"
            defaultValue={location ?? ''}
            placeholder={prefix === 'akad' ? 'Masjid Agung Al-Azhar' : 'Balai Kartini'}
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor={`${prefix}_address`}>
          Alamat lengkap
        </label>
        <textarea
          id={`${prefix}_address`}
          name={`${prefix}_address`}
          rows={2}
          className="input"
          defaultValue={address ?? ''}
          placeholder="Jl. Sisingamangaraja, Kebayoran Baru, Jakarta Selatan"
        />
      </div>
      <div>
        <label className="label" htmlFor={`${prefix}_maps_url`}>
          Link Google Maps
        </label>
        <input
          id={`${prefix}_maps_url`}
          name={`${prefix}_maps_url`}
          type="url"
          className="input"
          defaultValue={maps ?? ''}
          placeholder="https://maps.app.goo.gl/…"
        />
        <p className="hint">Tamu akan melihat tombol &ldquo;Lihat lokasi&rdquo; yang membuka link ini.</p>
      </div>
    </fieldset>
  );
}

export default function StepEvents({
  invitation,
  saving,
  onSave,
}: { invitation: Invitation } & StepSaveProps) {
  return (
    <StepForm
      title="Detail acara"
      description="Isi minimal satu acara. Hitung mundur mengikuti acara yang paling awal."
      saving={saving}
      onSave={onSave}
    >
      <EventFields prefix="akad" legend="Akad Nikah" invitation={invitation} />
      <div className="border-t border-line pt-5">
        <EventFields prefix="resepsi" legend="Resepsi" invitation={invitation} />
      </div>
    </StepForm>
  );
}
