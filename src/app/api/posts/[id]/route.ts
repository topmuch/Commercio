import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// DELETE /api/posts/[id] - Delete a post and its attachments (cascade)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify the post exists
    const post = await db.post.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Publication non trouvée.' },
        { status: 404 }
      )
    }

    // Delete the post (attachments and reactions are cascade deleted via schema)
    await db.post.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      data: { id },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
