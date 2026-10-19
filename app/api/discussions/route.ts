import { Prisma } from "@/generated/prisma/client";
import { deleteCacheByPrefix, fetchItems, invalidateCommentCaches, invalidateDiscussionCaches } from "@/lib/actions/caching";
import imagekit from "@/lib/image-kit";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = await currentUser();

    if (!user) return NextResponse.json("Unauthorized", { status: 401 });

    const query = searchParams.get("query") || "";
    const sort = searchParams.get("sort") || "top";
    const tagParams = searchParams.get("tag");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const cacheKey = `discussions:q=${query}:s=${sort}:t=${tagParams}:p=${page}:l=${limit}:u=${user.id}`;
    const responseData = await fetchItems({
      key: cacheKey,
      expires: 60 * 2,
      fetcher: async () => {
        const shadowbanFilter: Prisma.DiscussionWhereInput = user
          ? {
              OR: [{ author: { isShadowBanned: false } }, { authorId: user.id }],
            }
          : { author: { isShadowBanned: false } };
        const whereClause: Prisma.DiscussionWhereInput = {
          AND: [
            {
              author: {
                isBanned: false,
              },
            },
            shadowbanFilter,
            query
              ? {
                  OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } },
                    {
                      author: {
                        OR: [
                          { firstName: { contains: query, mode: "insensitive" } },
                          { lastName: { contains: query, mode: "insensitive" } },
                          { name: { contains: query, mode: "insensitive" } },
                        ],
                      },
                    },
                  ],
                }
              : {},

            tagParams
              ? {
                  tag: {
                    slug: tagParams,
                  },
                }
              : {},
          ],
        };

        let orderBy:
          | Prisma.DiscussionOrderByWithRelationInput
          | Prisma.DiscussionOrderByWithRelationInput[] = { createdAt: "desc" };
        switch (sort) {
          case "latest":
            orderBy = { createdAt: "desc" };
            break;

          case "oldest":
            orderBy = { createdAt: "asc" };
            break;

          case "controversial":
            orderBy = [{ dislikeCount: "desc" }, { comments: { _count: "desc" } }];
            break;

          case "top":
          default:
            orderBy = [{ likeCount: "desc" }, { comments: { _count: "desc" } }];
            break;
        }

        const [discussions, total] = await prisma.$transaction([
          prisma.discussion.findMany({
            where: whereClause,
            orderBy: orderBy,
            take: limit,
            skip: skip,
            include: {
              tag: true,
              author: {
                select: {
                  name: true,
                  firstName: true,
                  lastName: true,
                  profileUrl: true,
                  beltRank: true,
                  isShadowBanned: true,
                },
              },
              _count: {
                select: {
                  comments: true,
                  likes: true,
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
              likes: {
                where: {
                  userId: user.id,
                },
                select: {
                  type: true,
                },
              },
            },
          }),
          prisma.discussion.count({ where: whereClause }),
        ]);

        const discussionsWithStatus = discussions.map((d) => {
          const isBookmarked = d.bookmarks.length > 0;
          const userVote = d.likes[0]?.type;
          return {
            ...d,
            isBookmarked,
            isLiked: userVote === "like",
            isDisliked: userVote === "dislike",
            bookmarks: undefined,
            likes: undefined,
          };
        });
        return {
          data: discussionsWithStatus,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        };
      },
    });
    return NextResponse.json(responseData);
  } catch (error) {
    console.log(error);
    return NextResponse.json("Failed to fetch discussions!", { status: 500 });
  }
}
/**
 * /api/discussions
 * @description
 * fetches all the discussions and also applies filter, sorting and query search.
 */

type DiscussionAttachmentInput = {
  id: string;
  postUrl: string;
  type: string;
};

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json("Unauthorized", { status: 401 });
    const body = await request.json();
    const { title, description, authorId, tag, attachments = [] } = body;

    if (!title || !description || !authorId) {
      return NextResponse.json("Missing fields!", { status: 400 });
    }
    const newDiscussion = await prisma.discussion.create({
      data: {
        title,
        description,
        tag: {
          connect: {
            slug: tag.slug,
          },
        },
        author: {
          connect: {
            id: authorId,
          },
        },
        attachments: {
          create: attachments.map((post: DiscussionAttachmentInput) => ({
            id: post.id,
            postUrl: post.postUrl,
            type: post.type,
          })),
        },
      },
    });

    if (newDiscussion) {
      try {
        await deleteCacheByPrefix("discussions:");
      } catch (error) {
        console.error("Discussion list cache invalidation failed:", error);
      }
      return NextResponse.json(newDiscussion.id, { status: 200 });
    }
  } catch (error) {
    console.error("Failed to create the discussion!", error);
    return NextResponse.json("Error: failed to create the discussion", { status: 500 });
  }
}
/**
 * /api/discussions
 * @description
 * creates a new discussion by current user.
 */

export async function DELETE(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json("Unauthorized!", { status: 401 });
    const { searchParams } = new URL(request.url);
    const discussionId = searchParams.get("discussionId");

    if (!discussionId) return NextResponse.json("No discussion selected", { status: 400 });

    const discussion = await prisma.discussion.findUnique({
      where: {
        id: discussionId,
      },
      select: {
        authorId: true,
        attachments: true,
      },
    });

    if (discussion) {
      if (user.id !== discussion.authorId) {
        return NextResponse.json("You are not the author of this discussion!", { status: 403 });
      } else {
        const fileIds = discussion.attachments.map((att) => att.id);
        await imagekit.bulkDeleteFiles(fileIds);
        await prisma.discussion.delete({
          where: {
            id: discussionId,
            authorId: user.id,
          },
        });
        await Promise.all([
          invalidateDiscussionCaches(discussionId),
          invalidateCommentCaches(discussionId),
        ]);
        return NextResponse.json("Discussion deleted!", { status: 200 });
      }
    }
    return NextResponse.json("No discussion found!", { status: 404 });
  } catch (error) {
    console.log(error);
    return NextResponse.json("Failed to delete the discussion!", { status: 500 });
  }
}
/**
 * /api/discussions
 * @description
 * deletes a discussion given by id param by current user.
 */