import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// DELETE /api/clients/[id]/notes/[noteId] - Delete a specific note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) return Response.json({ error: 'Non authentifié' }, { status: 401 })
    const companyId = session.user.companyId

    const { id, noteId } = await params

    const note = await db.clientNote.findFirst({
      where: { id: noteId, clientId: id, companyId },
    })

    if (!note) {
      return NextResponse.json({ error: 'Note non trouvée.' }, { status: 404 })
    }

    await db.clientNote.delete({
      where: { id: noteId },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
