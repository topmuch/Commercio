import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// ─── GET: List all users ──────────────────────────────────────────────────
export async function GET() {
  try {
    const companyId = 'comp_1' // Default company

    const users = await db.user.findMany({
      where: { companyId },
      include: {
        _count: {
          select: {
            clients: true,
            orders: true,
            visits: true,
            posts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      data: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        avatar: u.avatar,
        role: u.role,
        active: u.active,
        createdAt: u.createdAt,
        counts: u._count,
      })),
      count: users.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── POST: Create a new user ──────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const companyId = 'comp_1'
    const body = await request.json()
    const { name, email, phone, password, role } = body

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Le nom, l\'email et le mot de passe sont obligatoires.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères.' },
        { status: 400 }
      )
    }

    const validRoles = ['super_admin', 'admin', 'director', 'commercial', 'accountant']
    const userRole = role && validRoles.includes(role) ? role : 'commercial'

    // Check if email already exists in the company
    const existing = await db.user.findFirst({
      where: { email, companyId },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà.' },
        { status: 409 }
      )
    }

    // Create the user
    const user = await db.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password,
        role: userRole,
        active: true,
        companyId,
      },
    })

    return NextResponse.json(
      {
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          active: user.active,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
