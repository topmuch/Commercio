import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/posts - List posts with filters, search, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const filter = searchParams.get('filter') || 'all'
    const search = searchParams.get('search') || ''
    const authorId = searchParams.get('authorId') || ''
    const companyId = searchParams.get('companyId') || 'comp_1'

    const where: Record<string, unknown> = { companyId }

    // Filter logic
    if (filter === 'images') {
      where.attachments = {
        some: { type: 'image' },
      }
    } else if (filter === 'documents') {
      where.attachments = {
        some: { type: 'document' },
      }
    } else if (filter === 'mine' && authorId) {
      where.authorId = authorId
    }

    // Search in content
    if (search) {
      where.content = { contains: search, mode: 'insensitive' }
    }

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          attachments: true,
          reactions: {
            select: {
              id: true,
              userId: true,
              type: true,
            },
          },
        },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.post.count({ where }),
    ])

    // Get comments count and current user reaction for each post
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const commentsCount = await db.postComment.count({
          where: { postId: post.id, parentCommentId: null },
        })

        return {
          id: post.id,
          content: post.content,
          authorId: post.authorId,
          companyId: post.companyId,
          author: post.author,
          attachments: post.attachments.map((a) => ({
            id: a.id,
            type: a.type,
            fileUrl: a.fileUrl,
            fileName: a.fileName,
            mimeType: a.mimeType,
            fileSize: a.fileSize,
          })),
          reactions: post.reactions,
          likesCount: post.likesCount,
          commentsCount,
          isPinned: post.isPinned,
          createdAt: post.createdAt,
        }
      })
    )

    return NextResponse.json({
      posts: postsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/posts - Create a new post (accepts FormData with files)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const content = formData.get('content') as string | null
    let authorId = formData.get('authorId') as string | null
    const companyId = (formData.get('companyId') as string) || 'comp_1'

    // Fallback: find first user if no authorId provided
    if (!authorId) {
      const firstUser = await db.user.findFirst({ select: { id: true } })
      authorId = firstUser?.id || null
    }

    if (!authorId) {
      return NextResponse.json(
        { error: 'Aucun utilisateur trouvé.' },
        { status: 400 }
      )
    }

    // Verify the author exists, fallback to first user if not found
    let author = await db.user.findUnique({
      where: { id: authorId },
      select: { id: true, name: true, avatar: true },
    })

    if (!author) {
      const fallbackUser = await db.user.findFirst({ select: { id: true, name: true, avatar: true } })
      if (fallbackUser) {
        author = fallbackUser
        authorId = fallbackUser.id
      } else {
        return NextResponse.json(
          { error: 'Aucun utilisateur trouvé en base.' },
          { status: 404 }
        )
      }
    }

    // Process uploaded files
    const { writeFile, mkdir } = await import('fs/promises')
    const path = await import('path')

    const attachmentData: Array<{
      type: string
      fileUrl: string
      fileName: string
      mimeType: string
      fileSize: number
    }> = []

    // Collect all image files (field name: "images")
    const images = formData.getAll('images').filter((f) => f instanceof File && f.size > 0)
    const documents = formData.getAll('documents').filter((f) => f instanceof File && f.size > 0)

    const allFiles = [...images, ...documents]

    for (const file of allFiles) {
      const f = file as File
      const bytes = await f.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const isImage = f.type.startsWith('image/')
      const fileType = isImage ? 'image' : 'document'

      const timestamp = Date.now()
      const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const uniqueFileName = `${timestamp}-${Math.random().toString(36).slice(2, 8)}-${safeName}`

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'posts')
      await mkdir(uploadDir, { recursive: true })

      const filePath = path.join(uploadDir, uniqueFileName)
      await writeFile(filePath, buffer)

      attachmentData.push({
        type: fileType,
        fileUrl: `/uploads/posts/${uniqueFileName}`,
        fileName: f.name,
        mimeType: f.type,
        fileSize: f.size,
      })
    }

    // Create post and attachments in a transaction
    const post = await db.$transaction(async (tx) => {
      return tx.post.create({
        data: {
          content: content || null,
          authorId,
          companyId,
          attachments: attachmentData.length > 0
            ? {
                create: attachmentData,
              }
            : undefined,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          attachments: true,
        },
      })
    })

    return NextResponse.json(
      {
        post: {
          id: post.id,
          content: post.content,
          authorId: post.authorId,
          companyId: post.companyId,
          author: post.author,
          attachments: post.attachments.map((a) => ({
            id: a.id,
            type: a.type,
            fileUrl: a.fileUrl,
            fileName: a.fileName,
            mimeType: a.mimeType,
            fileSize: a.fileSize,
          })),
          reactions: [],
          likesCount: 0,
          commentsCount: 0,
          isPinned: false,
          createdAt: post.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    console.error('Error creating post:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
