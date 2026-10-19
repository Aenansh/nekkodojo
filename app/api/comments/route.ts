import { Prisma } from "@/generated/prisma/client";
import { fetchItems, invalidateCommentCaches } from "@/lib/actions/caching";
import { buildCommentTree } from "@/lib/comment-tree";
import imagekit from "@/lib/image-kit";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const discussionId = searchParams.get("discussionId");
    const sort = searchParams.get("sort") || "top";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const user = await currentUser();
    if (!user) return NextResponse.json("Unauthorized", { status: 401 });
    if (!discussionId) return NextResponse.json("No discussion found!", { status: 404 });

    const cacheKey = `comments:d=${discussionId}:p=${page}:s=${sort}:l=${limit}:u=${user.id}`;
    const responseData = await fetchItems({
      key: cacheKey,
      expires: 60 * 2,
      fetcher: async () => {
        const visibilityFilter: Prisma.CommentWhereInput = {
          discussionId: discussionId,
          author: {
            isBanned: false,
            OR: [{ isShadowBanned: false }, { id: user.id }],
          },
        };

        const totalRoots = await prisma.comment.count({
          where: {
            ...visibilityFilter,
            parentId: null,
          },
        });
        const orderBy: Prisma.CommentOrderByWithRelationInput[] =
          sort === "top"
            ? [{ likeCount: "desc" }, { replies: { _count: "desc" } }]
            : [{ createdAt: "desc" }];

        const rootComments = await prisma.comment.findMany({
          where: {
            ...visibilityFilter,
            parentId: null,
          },
          take: limit,
          skip: skip,
          orderBy: orderBy,
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                beltRank: true,
                profileUrl: true,
                isShadowBanned: true,
              },
            },
            discussion: {
              select: {
                authorId: true,
              },
            },
            attachments: true,
            _count: {
              select: {
                replies: true,
              },
            },
            likes: {
              where: {
                userId: user.id,
              },
              select: {
                type: true,
              },
            },
            bookmarks: {
              where: {
                userId: user.id,
              },
              select: {
                id: true,
              },
            },
          },
        });

        const allReplies = await prisma.comment.findMany({
          where: {
            ...visibilityFilter,
            parentId: { not: null },
          },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                profileUrl: true,
                beltRank: true,
                isShadowBanned: true,
              },
            },
            _count: {
              select: { replies: true },
            },
            likes: { where: { userId: user.id }, select: { type: true } },
            bookmarks: { where: { userId: user.id }, select: { id: true } },
            attachments: true,
          },
          orderBy: { createdAt: "asc" },
        });

        const combinedComments = [...rootComments, ...allReplies];

        const processedComments = combinedComments.map((comment) => ({
          ...comment,
          isLiked: comment.likes[0]?.type === "like",
          isDisliked: comment.likes[0]?.type === "dislike",
          isBookmarked: comment.bookmarks.length > 0,
          likes: undefined,
          bookmarks: undefined,
        }));

        const totalComments = await prisma.comment.count({
          where: {
            discussionId,
          },
        });

        const hasMore = skip + rootComments.length < totalRoots;
        const data = buildCommentTree(processedComments);

        return {
          data,
          meta: {
            total: totalComments,
            totalRoots,
            hasMore,
            page,
          },
        };
      },
    });

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("FETCH COMMENTS ERROR:", error);
    return NextResponse.json("Internal Error", { status: 500 });
  }
}
/**
 * /api/comments
 * @description
 * fetches all the comments of a discussion
 */

export async function POST(request: Request) {
  let attId = "";
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json("Unauthorized!", { status: 401 });

    const body = await request.json();
    const { description, discussionId, attachment, parentId } = body;
    if (!description || !discussionId) {
      return NextResponse.json("Invalid comment!", { status: 400 });
    }
    if (attachment) attId = attachment.id;
    const attachmentData = attachment
      ? {
          attachments: {
            create: {
              id: attachment.id,
              postUrl: attachment.postUrl,
              type: attachment.type,
            },
          },
        }
      : {};
    const newComment = await prisma.comment.create({
      data: {
        description,
        authorId: user.id,
        discussionId: discussionId,
        parentId: parentId || null,
        ...attachmentData,
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            name: true,
            profileUrl: true,
            beltRank: true,
          },
        },
        attachments: true,
      },
    });

    if (!newComment) {
      throw new Error("Failed to make the comment");
    }

    await invalidateCommentCaches(discussionId);
    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error(error);
    imagekit.deleteFile(attId);
    return NextResponse.json(error, { status: 500 });
  }
}
/**
 * /api/comments
 * @description
 * creates a comment on a discussion.
 */

export async function DELETE(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json("Unauthorized!", { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("commentId");
    if (!id) return NextResponse.json("No such comment found!", { status: 404 });

    const res = await prisma.comment.findUnique({
      where: {
        id,
      },
      select: {
        authorId: true,
        attachments: true,
        discussion: {
          select: {
            id: true,
            authorId: true,
          },
        },
      },
    });
    if (!res) return NextResponse.json("No such comment.", { status: 404 });
    if (res.authorId !== user.id && res.discussion.authorId !== user.id) {
      return NextResponse.json("You are not the author of this comment!", { status: 403 });
    } else {
      if (res.attachments) await imagekit.deleteFile(res.attachments.id);

      await prisma.comment.delete({
        where: { id, authorId: res.authorId },
      });
    }
    await invalidateCommentCaches(res.discussion.id);
    return NextResponse.json("Comment deleted!", { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json("Failed to delete the comment!", { status: 500 });
  }
}
/**
 * /api/comments
 * @description
 * deletes a comment either by author or discussion author.
 */