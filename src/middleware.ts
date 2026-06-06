import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Vérifier que NEXTAUTH_SECRET est défini
  if (!process.env.NEXTAUTH_SECRET) {
    console.error('❌ CRITICAL: NEXTAUTH_SECRET is not defined!');
    return new NextResponse('Server configuration error', { status: 500 });
  }

  // Routes publiques (pas d'auth requise)
  const publicPaths = ['/', '/login', '/register', '/demo', '/contact', '/api/auth', '/boutique', '/_next', '/favicon.ico', '/manifest.json'];
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Vérifier le token de session
  const token = request.cookies.get('next-auth.session-token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
