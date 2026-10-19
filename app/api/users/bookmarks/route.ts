import { fetchItems } from "@/lib/actions/caching";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json("Unauthorized!", { status: 401 });

    const bookmarks = await fetchItems({
      key: `user:bookmarks:${user.id}`,
      expires: 300,
      fetcher: async () => {
        const allBookmarks = await prisma.bookmark.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          include: {
            discussion: {
              where: { author: { isBanned: false } },
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
                tag: { select: { slug: true } },
                _count: { select: { comments: true } },
                likes: {
                  where: { userId: user.id },
                  select: { type: true },
                },
              },
            },
            comment: {
              where: { author: { isBanned: false } },
              include: {
                author: {
                  select: {
                    name: true,
                    firstName: true,
                    lastName: true,
                    profileUrl: true,
                    beltRank: true,
                  },
                },
                attachments: true,
                likes: {
                  where: { userId: user.id },
                  select: { type: true },
                },
              },
            },
          },
        });

        const discussions = allBookmarks
          .filter((bookmark) => bookmark.discussion !== null)
          .map((bookmark) => {
            const discussion = bookmark.discussion!;
            return {
              ...discussion,
              isBookmarked: true,
              isLiked: discussion.likes?.[0]?.type === "like",
              isDisliked: discussion.likes?.[0]?.type === "dislike",
              likes: undefined,
            };
          });

        const comments = allBookmarks
          .filter((bookmark) => bookmark.comment !== null)
          .map((bookmark) => {
            const comment = bookmark.comment!;
            return {
              ...comment,
              isBookmarked: true,
              isLiked: comment.likes?.[0]?.type === "like",
              isDisliked: comment.likes?.[0]?.type === "dislike",
              likes: undefined,
            };
          });

        return { discussions, comments };
      },
    });

    return NextResponse.json(bookmarks, { status: 200, headers: noStoreHeaders });
  } catch (error) {
    console.error("Bookmark Fetch Error:", error);
    return NextResponse.json("Internal Error", { status: 500 });
  }
}
/**
 * /api/users/bookmarks
 * @description
 * fetches all the user's bookmarked posts and comments
 */
