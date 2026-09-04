'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import StepForm, { type StepSaveProps } from './StepForm';
import { randomSlug } from '@/lib/utils';
import { DEMO_NOTICE, isDemoMode } from '@/lib/demo/data';
import type { DigitalEnvelopeConfig } from '@/lib/types/database';

export default function StepEnvelope({
  envelope,
  saving,
  onSave,
}: { envelope: DigitalEnvelopeConfig | null } & StepSaveProps) {
  const [qris, setQris] = useState(envelope?.ewallet_qris_url ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadQris(file: File) {
    setError(null);

    if (isDemoMode) {
      setError(`${DEMO_NOTICE} Unggah QRIS membutuhkan Supabase Storage.`);
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi berakhir, silakan masuk lagi.');

      // Ambil wedding_id dari invitation supaya path sesuai policy storage.
      const { data: invitation } = await supabase
        .from('invitations')
        .select('wedding_id')
        .eq('id', envelope?.invitation_id ?? '')
        .maybeSingle();
      if (!invitation) throw new Error('Undangan tidak ditemukan.');

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
      const path = `${invitation.wedding_id}/qris-${randomSlug(8)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('invitation-media')
        .upload(path, file, { cacheControl: '31536000' });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('invitation-media').getPublicUrl(path);
      setQris(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah QRIS.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <StepForm
      title="Amplop digital"
      description="Informasi rekening ditampilkan apa adanya dengan tombol salin — belum ada pembayaran otomatis di fase ini."
      saving={saving}
      onSave={onSave}
    >
      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="is_enabled"
          defaultChecked={envelope?.is_enabled ?? true}
          className="accent-brand-500"
        />
        Tampilkan amplop digital di undangan
      </label>

      <fieldset className="grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
        <legend className="font-display text-xl text-brand-700">Rekening 1</legend>
        <div>
          <label className="label" htmlFor="bank_name">Bank / e-wallet</label>
          <input id="bank_name" name="bank_name" className="input" defaultValue={envelope?.bank_name ?? ''} placeholder="BCA" />
        </div>
        <div>
          <label className="label" htmlFor="account_number">Nomor rekening</label>
          <input id="account_number" name="account_number" className="input" defaultValue={envelope?.account_number ?? ''} placeholder="1234567890" />
        </div>
        <div>
          <label className="label" htmlFor="account_holder">Atas nama</label>
          <input id="account_holder" name="account_holder" className="input" defaultValue={envelope?.account_holder ?? ''} placeholder="Rizky Pratama" />
        </div>
      </fieldset>

      <fieldset className="grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
        <legend className="font-display text-xl text-brand-700">Rekening 2 (opsional)</legend>
        <div>
          <label className="label" htmlFor="bank_name_2">Bank / e-wallet</label>
          <input id="bank_name_2" name="bank_name_2" className="input" defaultValue={envelope?.bank_name_2 ?? ''} placeholder="Mandiri" />
        </div>
        <div>
          <label className="label" htmlFor="account_number_2">Nomor rekening</label>
          <input id="account_number_2" name="account_number_2" className="input" defaultValue={envelope?.account_number_2 ?? ''} />
        </div>
        <div>
          <label className="label" htmlFor="account_holder_2">Atas nama</label>
          <input id="account_holder_2" name="account_holder_2" className="input" defaultValue={envelope?.account_holder_2 ?? ''} />
        </div>
      </fieldset>

      <div className="border-t border-line pt-5">
        <span className="label">QRIS</span>
        <input type="hidden" name="ewallet_qris_url" value={qris} />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Mengunggah…' : 'Unggah gambar QRIS'}
          </button>
          {qris && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qris} alt="QRIS" className="h-20 w-20 rounded border border-line object-contain" />
              <button type="button" className="btn-ghost btn-sm text-red-600" onClick={() => setQris('')}>
                Hapus
              </button>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => e.target.files?.[0] && void uploadQris(e.target.files[0])}
        />
      </div>

      {error && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="gift_address">Alamat kirim kado (opsional)</label>
          <textarea id="gift_address" name="gift_address" rows={2} className="input" defaultValue={envelope?.gift_address ?? ''} />
        </div>
        <div>
          <label className="label" htmlFor="note">Catatan untuk tamu</label>
          <textarea id="note" name="note" rows={2} className="input" defaultValue={envelope?.note ?? ''} placeholder="Doa restu Anda sudah lebih dari cukup." />
        </div>
      </div>
    </StepForm>
  );
}
