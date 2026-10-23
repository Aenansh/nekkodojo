import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;
    if (!questionId) {
      return NextResponse.json("Question ID is required", { status: 400 });
    }

    const [question, user] = await Promise.all([
      prisma.question.findUnique({
        where: { id: questionId },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          difficulty: true,
          timeLimit: true,
          memoryLimit: true,
          judgeType: true,
          hasChecker: true,
          externalPlatformUrl: true,
          solutionUrl: true,
          noOfSubmissions: true,
          noOfPeopleSolved: true,
          categories: {
            select: { id: true, name: true, slug: true },
            orderBy: { categoryOrder: "asc" },
          },
          companyTag: {
            select: { id: true, name: true, slug: true, logo: true },
            orderBy: { name: "asc" },
          },
          supportedLanguages: {
            where: { isSupported: true },
            select: {
              id: true,
              name: true,
              slug: true,
              monacoSlug: true,
              extension: true,
            },
            orderBy: { name: "asc" },
          },
          testcases: {
            where: { isHidden: false },
            select: {
              id: true,
              input: true,
              expectedOutput: true,
              isHidden: true,
            },
            orderBy: { id: "asc" },
          },
          codestubs: {
            where: {
              language: {
                isSupported: true,
                supportedByQuestions: { some: { id: questionId } },
              },
            },
            select: {
              id: true,
              languageId: true,
              userSnippet: true,
              language: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  monacoSlug: true,
                  extension: true,
                },
              },
            },
            orderBy: { language: { name: "asc" } },
          },
        },
      }),
      currentUser(),
    ]);

    if (!question) {
      return NextResponse.json("Question not found", { status: 404 });
    }

    const userProgress = user
      ? await prisma.userProgress.findUnique({
          where: {
            userId_questionId: { userId: user.id, questionId },
          },
          select: {
            status: true,
            userCode: true,
            languageId: true,
            result: true,
            timeTaken: true,
            memoryUsed: true,
            testcasesPassed: true,
            totalTestcases: true,
          },
        })
      : null;

    return NextResponse.json({ ...question, userProgress }, { status: 200 });
  } catch (error) {
    console.error("[QUESTION_GET]", error);
    return NextResponse.json("Failed to fetch question", { status: 500 });
  }
}
/**
 * /api/questions/[questionId]
 * @description
 * fetches question details, public testcases, supported languages, codestubs, and the current user's progress.
 */