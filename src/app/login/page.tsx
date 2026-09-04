import { Suspense } from 'react';
import Link from 'next/link';
import AuthForm from '@/components/AuthForm';

export const metadata = { title: 'Masuk' };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <Link href="/" className="mb-8 text-center font-display text-3xl tracking-[0.2em] text-brand-600">
        SAHAJA
      </Link>
      <h1 className="mb-6 text-center text-lg font-medium">Masuk ke dashboard</h1>
      <Suspense fallback={<div className="card h-72 animate-pulse" />}>
        <AuthForm mode="login" />
      </Suspense>
    </main>
  );
}
