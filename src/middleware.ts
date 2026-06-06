import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that are publicly accessible without authentication
const publicApiRoutes = [
  '/api/auth/',   // NextAuth login/register
  '/api/store/',  // Public boutique API
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /api/* routes (except public ones)
  if (pathname.startsWith('/api/')) {
    // Skip public routes
    for (const publicRoute of publicApiRoutes) {
      if (pathname.startsWith(publicRoute)) {
        return NextResponse.next()
      }
    }

    // Require NEXTAUTH_SECRET to be set — no more "demo mode bypass"
    if (!process.env.NEXTAUTH_SECRET) {
      console.error(
        '[SECURITY] NEXTAUTH_SECRET is not set. ' +
        'API routes are blocked. Set NEXTAUTH_SECRET in your .env file. ' +
        'Generate one with: openssl rand -base64 32'
      )
      return NextResponse.json(
        { error: 'Configuration serveur incomplète. Contactez l\'administrateur.' },
        { status: 503 }
      )
    }

    // Check for JWT token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
  ],
}
