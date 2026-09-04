import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Halaman undangan publik (/u/...) sengaja TIDAK lewat middleware auth
  // supaya tetap ringan & cepat diakses tamu.
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register'],
};
