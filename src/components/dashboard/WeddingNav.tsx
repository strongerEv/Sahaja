'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '', label: 'Ringkasan' },
  { href: '/builder', label: 'Builder' },
  { href: '/guests', label: 'Daftar Tamu' },
  { href: '/rsvp', label: 'RSVP' },
  { href: '/guestbook', label: 'Buku Tamu' },
  { href: '/stats', label: 'Statistik' },
  { href: '/planner', label: 'Planner', soon: true },
  { href: '/budget', label: 'Budget', soon: true },
  { href: '/settings', label: 'Pengaturan' },
];

export default function WeddingNav({ weddingId }: { weddingId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/${weddingId}`;

  return (
    <nav className="mt-6 -mx-5 overflow-x-auto px-5">
      <ul className="flex min-w-max gap-1 border-b border-line pb-px">
        {ITEMS.map((item) => {
          const href = `${base}${item.href}`;
          const active = item.href === '' ? pathname === base : pathname.startsWith(href);
          return (
            <li key={item.href}>
              <Link
                href={href}
                className={cn(
                  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 text-sm transition',
                  active
                    ? 'border-brand-500 font-medium text-brand-700'
                    : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {item.label}
                {item.soon && (
                  <span className="badge bg-brand-50 px-1.5 py-0 text-[10px] text-brand-500">
                    soon
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
