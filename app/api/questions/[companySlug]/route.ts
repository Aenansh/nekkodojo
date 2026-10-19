import { prisma } from "@/lib/prisma";
import { fetchItems } from "@/lib/actions/caching";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  try {
    const { companySlug } = await params;
    const user = await currentUser();

    const [company, userProgressData] = await Promise.all([
      fetchItems({
        key: `company:${companySlug}`,
        expires: 3600,
        fetcher: () =>
          prisma.company.findUnique({
            where: { slug: companySlug },
            include: {
              questions: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  difficulty: true,
                  externalPlatformUrl: true,
                  solutionUrl: true,
                },
              },
            },
          }),
      }),
      user
        ? prisma.userProgress.findMany({
            where: { userId: user.id },
            select: { questionId: true, status: true },
          })
        : Promise.resolve([]),
    ]);

    if (!company) return NextResponse.json("Company not found", { status: 404 });

    const userProgress: Record<string, string> = {};
    userProgressData.forEach((progress) => {
      userProgress[progress.questionId] = progress.status.toLowerCase();
    });

    return NextResponse.json(
      { companyName: company.name, questions: company.questions, userProgress },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET COMPANY QUESTIONS ERROR:", error);
    return NextResponse.json("Failed to fetch company questions", { status: 500 });
  }
}
/**
 * /api/questions/:company-slug
 * @description
 * fetches a particular company's sheet of questions.
 */