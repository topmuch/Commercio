import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that are publicly accessible without authentication
const publicApiRoutes = [
  '/api/auth/',
  '/api/seed',
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

    // Check for JWT token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || 'distribusn-dev-secret-change-in-production',
    })

    if (!token) {
      // In demo mode, allow API requests without auth
      // When NEXTAUTH_SECRET is properly set and users are logged in,
      // uncomment below to enforce auth:
      // return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
      return NextResponse.next()
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
