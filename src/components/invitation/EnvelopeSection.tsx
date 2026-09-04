'use client';

import { useState } from 'react';
import type { Dict } from '@/lib/i18n';
import type { DigitalEnvelopeConfig } from '@/lib/types/database';
import { SectionShell } from './Sections';

function AccountCard({
  bank,
  number,
  holder,
  dict,
}: {
  bank: string | null;
  number: string | null;
  holder: string | null;
  dict: Dict;
}) {
  const [copied, setCopied] = useState(false);
  if (!bank && !number) return null;

  async function copy() {
    if (!number) return;
    try {
      await navigator.clipboard.writeText(number);
    } catch {
      const area = document.createElement('textarea');
      area.value = number;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">{bank}</p>
      <p className="mt-3 font-display text-2xl tracking-wider theme-text">{number}</p>
      {holder && (
        <p className="mt-1 text-sm text-muted">
          {dict.accountHolder} {holder}
        </p>
      )}
      {number && (
        <button
          type="button"
          onClick={copy}
          className="theme-border theme-text mt-4 rounded-full border px-5 py-2 text-xs tracking-wide transition hover:opacity-75"
        >
          {copied ? dict.copied : dict.copyAccount}
        </button>
      )}
    </div>
  );
}

export default function EnvelopeSection({
  envelope,
  dict,
}: {
  envelope: DigitalEnvelopeConfig | null;
  dict: Dict;
}) {
  if (!envelope || !envelope.is_enabled) return null;

  const hasContent =
    envelope.account_number ||
    envelope.account_number_2 ||
    envelope.ewallet_qris_url ||
    envelope.gift_address;
  if (!hasContent) return null;

  return (
    <SectionShell title={dict.envelope} tone="white">
      <p className="mb-8 text-sm leading-relaxed text-muted">
        {envelope.note || dict.envelopeIntro}
      </p>

      <div className="space-y-4">
        <AccountCard
          bank={envelope.bank_name}
          number={envelope.account_number}
          holder={envelope.account_holder}
          dict={dict}
        />
        <AccountCard
          bank={envelope.bank_name_2}
          number={envelope.account_number_2}
          holder={envelope.account_holder_2}
          dict={dict}
        />

        {envelope.ewallet_qris_url && (
          <div className="rounded-2xl border border-line bg-white p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">QRIS</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={envelope.ewallet_qris_url}
              alt="QRIS"
              loading="lazy"
              className="mx-auto mt-4 max-h-64 w-auto rounded-lg"
            />
          </div>
        )}

        {envelope.gift_address && (
          <div className="rounded-2xl border border-line bg-white p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">{dict.giftAddress}</p>
            <p className="mt-3 text-sm leading-relaxed">{envelope.gift_address}</p>
          </div>
        )}
      </div>
    </SectionShell>
  );
}
