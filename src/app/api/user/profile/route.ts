import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const USER_ID = 'user_1'

// PUT /api/user/profile — Mettre à jour le profil utilisateur
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone } = body

    // Vérifier que l'utilisateur existe
    const existing = await db.user.findUnique({
      where: { id: USER_ID },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    // Ne mettre à jour que les champs fournis
    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (email !== undefined) data.email = email
    if (phone !== undefined) data.phone = phone

    const user = await db.user.update({
      where: { id: USER_ID },
      data,
    })

    return NextResponse.json({ data: user })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Échec de la mise à jour du profil'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
