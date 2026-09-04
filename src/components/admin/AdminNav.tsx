'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/admin', label: 'Ringkasan' },
  { href: '/admin/users', label: 'Pengguna' },
  { href: '/admin/templates', label: 'Template' },
  { href: '/admin/packages', label: 'Paket harga' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav>
      <ul className="flex gap-1 border-b border-line">
        {ITEMS.map((item) => {
          const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'inline-block rounded-t-lg border-b-2 px-4 py-2.5 text-sm transition',
                  active
                    ? 'border-brand-500 font-medium text-brand-700'
                    : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
