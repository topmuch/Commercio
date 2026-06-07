import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  // Vérifier que NEXTAUTH_SECRET est défini
  if (!process.env.NEXTAUTH_SECRET) {
    console.error('❌ CRITICAL: NEXTAUTH_SECRET is not defined!')
    return new NextResponse('Server configuration error', { status: 500 })
  }

  // Routes publiques (pas d'auth requise)
  const publicPaths = ['/', '/login', '/register', '/demo', '/contact', '/api/auth', '/api/register', '/boutique', '/_next', '/favicon.ico', '/manifest.json', '/sw.js']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isPublicPath) {
    return NextResponse.next()
  }

  // Vérifier le token JWT
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Vérification de rôle pour les routes admin
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin')
  const userRole = token.role as string | undefined
  if (isAdminPath && userRole !== 'company_admin' && userRole !== 'super_admin' && userRole !== 'admin' && userRole !== 'director') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Ajouter les infos utilisateur aux headers pour les API
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', (token.sub || token.id || '') as string)
  requestHeaders.set('x-user-role', (userRole || '') as string)
  requestHeaders.set('x-company-id', (token.companyId || '') as string)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
