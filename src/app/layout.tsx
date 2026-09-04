import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import { siteUrlObject } from '@/lib/site-url';
import './globals.css';

// Font di-self-host oleh Next supaya halaman undangan tidak menunggu
// request ke domain pihak ketiga.
const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Sahaja — Undangan Pernikahan Digital',
    template: '%s · Sahaja',
  },
  description:
    'Buat undangan pernikahan digital yang rapi dan personal: RSVP, buku tamu, amplop digital, dan rekap tamu dalam satu tempat.',
  metadataBase: siteUrlObject(),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
