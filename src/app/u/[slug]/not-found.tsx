import Link from 'next/link';

export default function InvitationNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-5xl text-brand-500">Sahaja</p>
      <h1 className="mt-6 font-display text-3xl">Undangan tidak ditemukan</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Link mungkin salah ketik, atau undangan belum dipublikasikan oleh pemiliknya.
      </p>
      <Link href="/" className="btn-ghost mt-8">
        Kembali ke beranda
      </Link>
    </main>
  );
}
