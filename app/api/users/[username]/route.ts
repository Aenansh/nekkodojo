import { QuestionStatusType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { calculateReputation } from "@/utils/repCalc";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const [{ username }, current] = await Promise.all([params, currentUser()]);
    const profileUser = await prisma.user.findFirst({
      where: { name: username },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        bio: true,
        profileUrl: true,
        email: true,
        createdAt: true,
        socialLinks: { select: { id: true, platform: true, platformUrl: true } },
        beltRank: true,
      },
    });

    if (!profileUser) return NextResponse.json("User not found", { status: 404 });

    const isOwnProfile = current?.id === profileUser.id;
    const [
      solvedQuestions,
      discussions,
      comments,
      categories,
      companies,
    ] = await Promise.all([
      prisma.userProgress.findMany({
        where: { userId: profileUser.id, status: QuestionStatusType.completed },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          updatedAt: true,
          question: {
            select: { id: true, title: true, difficulty: true, externalPlatformUrl: true },
          },
        },
      }),
      prisma.discussion.findMany({
        where: { authorId: profileUser.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          createdAt: true,
          likeCount: true,
          dislikeCount: true,
          _count: { select: { comments: true } },
        },
      }),
      prisma.comment.findMany({
        where: { authorId: profileUser.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          description: true,
          createdAt: true,
          likeCount: true,
          dislikeCount: true,
          discussion: { select: { id: true, title: true } },
        },
      }),
      prisma.category.findMany({
        include: { questions: { select: { id: true } } },
      }),
      prisma.company.findMany({
        include: { questions: { select: { id: true } } },
      }),
    ]);

    const solvedSet = new Set(solvedQuestions.map(({ question }) => question.id));
    const totalSolved = solvedSet.size;
    const difficultyCounts = {
      Easy: solvedQuestions.filter(({ question }) => question.difficulty === "Easy").length,
      Medium: solvedQuestions.filter(({ question }) => question.difficulty === "Medium").length,
      Hard: solvedQuestions.filter(({ question }) => question.difficulty === "Hard").length,
    };

    const activityMap = new Map<string, number>();
    for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      activityMap.set(date.toISOString().split("T")[0], 0);
    }
    solvedQuestions.forEach(({ updatedAt }) => {
      const date = updatedAt.toISOString().split("T")[0];
      if (activityMap.has(date)) activityMap.set(date, (activityMap.get(date) ?? 0) + 1);
    });
    const activityData = Array.from(activityMap, ([date, count]) => ({
      date: date.slice(5),
      count,
    }));

    const categoryStats = categories
      .map((category) => ({
        name: category.name,
        total: category.questions.length,
        solved: category.questions.filter(({ id }) => solvedSet.has(id)).length,
      }))
      .filter(({ total }) => total > 0);

    const companyStats = companies
      .map((company) => ({
        id: company.id,
        name: company.name,
        logo: company.logo ?? "",
        total: company.questions.length,
        solved: company.questions.filter(({ id }) => solvedSet.has(id)).length,
      }))
      .filter(({ solved }) => solved > 0)
      .sort((a, b) => b.solved - a.solved);

    const discussionLikes = discussions.reduce((total, item) => total + item.likeCount, 0);
    const discussionDislikes = discussions.reduce((total, item) => total + item.dislikeCount, 0);
    const commentLikes = comments.reduce((total, item) => total + item.likeCount, 0);
    const commentDislikes = comments.reduce((total, item) => total + item.dislikeCount, 0);
    const reputation = calculateReputation({
      solvedEasy: difficultyCounts.Easy,
      solvedMedium: difficultyCounts.Medium,
      solvedHard: difficultyCounts.Hard,
      discussionUpvotes: discussionLikes,
      discussionDownvotes: discussionDislikes,
      commentUpvotes: commentLikes,
      commentDownvotes: commentDislikes,
      acceptedAnswers: totalSolved,
    });

    return NextResponse.json({
      user: profileUser,
      stats: {
        solved: totalSolved,
        discussions: discussions.length,
        comments: comments.length,
        reputation,
      },
      isOwnProfile,
      totalSolved,
      difficultyStats: [
        { name: "Easy", value: difficultyCounts.Easy, color: "#22c55e" },
        { name: "Medium", value: difficultyCounts.Medium, color: "#eab308" },
        { name: "Hard", value: difficultyCounts.Hard, color: "#ef4444" },
      ],
      categoryStats,
      companyStats,
      activityData,
      solvedQuestions,
      discussions,
      comments,
    });
  } catch (error) {
    console.error("GET USER PROFILE ERROR:", error);
    return NextResponse.json("Failed to fetch user profile", { status: 500 });
  }
}
/**
 * /api/users/:id
 * @description
 * fetches user's profile by id.
 */