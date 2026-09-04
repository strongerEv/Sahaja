import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { isDemoMode } from '@/lib/demo/data';

export async function middleware(request: NextRequest) {
  // Mode demo: belum ada Supabase, jadi tidak ada sesi untuk di-refresh
  // maupun gerbang login yang perlu dijaga.
  if (isDemoMode) return NextResponse.next();

  return updateSession(request);
}

export const config = {
  // Halaman undangan publik (/u/...) sengaja TIDAK lewat middleware auth
  // supaya tetap ringan & cepat diakses tamu.
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register'],
};
