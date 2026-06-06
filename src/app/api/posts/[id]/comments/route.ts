import { db } from '@/lib/db'
import { getCompanyId } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/posts/[id]/comments - List top-level comments for a post
export async function GET(
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

    // Fetch top-level comments only (parentCommentId is null)
    // and include the count of replies for each
    const comments = await db.postComment.findMany({
      where: {
        postId: id,
        parentCommentId: null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        replies: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      content: comment.content,
      parentCommentId: comment.parentCommentId,
      author: comment.author,
      repliesCount: comment.replies.length,
      createdAt: comment.createdAt,
    }))

    return NextResponse.json({
      comments: formattedComments,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/posts/[id]/comments - Create a comment on a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    let { authorId, content, parentCommentId } = body

    // Fallback: if no authorId, use first user in DB
    if (!authorId) {
      const firstUser = await db.user.findFirst({ where: { active: true }, select: { id: true } })
        || await db.user.findFirst({ select: { id: true } })
      if (firstUser) authorId = firstUser.id
    }

    if (!authorId || !content) {
      return NextResponse.json(
        { error: 'authorId et content sont requis.' },
        { status: 400 }
      )
    }

    // Verify the post exists
    const post = await db.post.findUnique({
      where: { id },
      select: { id: true, commentsCount: true },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Publication non trouvée.' },
        { status: 404 }
      )
    }

    // If replying to a comment, verify the parent comment exists
    if (parentCommentId) {
      const parentComment = await db.postComment.findUnique({
        where: { id: parentCommentId },
        select: { id: true },
      })
      if (!parentComment) {
        return NextResponse.json(
          { error: 'Commentaire parent non trouvé.' },
          { status: 404 }
        )
      }
    }

    // Create comment and increment commentsCount in a transaction
    const comment = await db.$transaction(async (tx) => {
      // Create the comment
      const createdComment = await tx.postComment.create({
        data: {
          postId: id,
          authorId,
          content,
          parentCommentId: parentCommentId || null,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: true,
            },
          },
        },
      })

      // Increment the post's commentsCount (only for top-level comments)
      if (!parentCommentId) {
        await tx.post.update({
          where: { id },
          data: {
            commentsCount: {
              increment: 1,
            },
          },
        })
      }

      return createdComment
    })

    return NextResponse.json(
      {
        comment: {
          id: comment.id,
          postId: comment.postId,
          authorId: comment.authorId,
          content: comment.content,
          parentCommentId: comment.parentCommentId,
          author: comment.author,
          repliesCount: 0,
          createdAt: comment.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
