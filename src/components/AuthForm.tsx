'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isDemoMode } from '@/lib/demo/data';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/dashboard';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    // Mode demo: tidak ada Supabase Auth, jadi langsung masuk ke dashboard contoh.
    if (isDemoMode) {
      router.push(next);
      return;
    }

    const supabase = createClient();

    try {
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (signUpError) throw signUpError;

        // Kalau konfirmasi email diaktifkan, sesi belum terbentuk.
        if (!data.session) {
          setNotice('Akun dibuat. Cek email Anda untuk konfirmasi, lalu masuk.');
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  if (isDemoMode) {
    return (
      <div className="card space-y-4 text-center">
        <p className="text-sm leading-relaxed text-muted">
          Mode demo aktif — belum ada Supabase, jadi tidak ada pendaftaran atau kata sandi.
          Masuk saja untuk melihat dashboard beserta data contohnya.
        </p>
        <button type="button" className="btn-primary w-full" onClick={() => router.push(next)}>
          Masuk ke dashboard demo
        </button>
        <Link href="/demo" className="block text-sm text-brand-600 underline">
          Cara mengaktifkan penyimpanan
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      {mode === 'register' && (
        <div>
          <label className="label" htmlFor="name">
            Nama
          </label>
          <input
            id="name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama Anda"
            required
          />
        </div>
      )}

      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@email.com"
          autoComplete="email"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          Kata sandi
        </label>
        <input
          id="password"
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 8 karakter"
          minLength={8}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          required
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700" role="status">
          {notice}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? 'Memproses…' : mode === 'register' ? 'Daftar' : 'Masuk'}
      </button>

      <p className="text-center text-sm text-muted">
        {mode === 'register' ? (
          <>
            Sudah punya akun?{' '}
            <Link href="/login" className="text-brand-600 underline">
              Masuk
            </Link>
          </>
        ) : (
          <>
            Belum punya akun?{' '}
            <Link href="/register" className="text-brand-600 underline">
              Daftar
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
