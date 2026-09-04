'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { togglePublish } from '@/lib/actions/invitation';

export default function PublishToggle({
  weddingId,
  invitationId,
  isPublished,
}: {
  weddingId: string;
  invitationId: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const result = await togglePublish(weddingId, invitationId, !isPublished);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={isPublished ? 'btn-ghost btn-sm' : 'btn-primary btn-sm'}
      >
        {pending ? 'Memproses…' : isPublished ? 'Jadikan draft' : 'Publikasikan'}
      </button>
      {error && (
        <p className="absolute right-0 top-full z-10 mt-2 w-64 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 shadow">
          {error}
        </p>
      )}
    </div>
  );
}
