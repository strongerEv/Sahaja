'use client';

import { useState } from 'react';

export default function CopyButton({
  value,
  label = 'Salin',
  className = 'btn-ghost btn-sm',
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback untuk browser/konteks tanpa Clipboard API.
      const area = document.createElement('textarea');
      area.value = value;
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
    <button type="button" onClick={copy} className={className}>
      {copied ? 'Tersalin ✓' : label}
    </button>
  );
}
