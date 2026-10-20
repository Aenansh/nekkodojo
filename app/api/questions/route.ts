import { Prisma } from "@/generated/prisma/client";
import { QuestionWhereInput } from "@/generated/prisma/models";
import { fetchItems } from "@/lib/actions/caching";
import { generateSlug } from "@/lib/actions/makeSlug";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { JudgeType } from "@/generated/prisma/enums";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = await currentUser();
    if (!user) return NextResponse.json("Unauthorized!", { status: 401 });
    if (searchParams.get("view") === "library") {
      const companiesPromise = fetchItems({
        key: "problems:companies",
        expires: 300,
        fetcher: async () =>
          prisma.company.findMany({
            take: 20,
            orderBy: { questions: { _count: "desc" } },
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              websiteUrl: true,
              _count: { select: { questions: true } },
              questions: { select: { id: true } },
            },
          }),
      });

      const categoriesPromise = fetchItems({
        key: "problems:categories",
        expires: 300,
        fetcher: async () =>
          prisma.category.findMany({
            orderBy: { categoryOrder: "asc" },
            include: {
              questions: {
                orderBy: { title: "asc" },
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  description: true,
                  difficulty: true,
                  externalPlatformUrl: true,
                  solutionUrl: true,
                },
              },
            },
          }),
      });

      const [userProgressData, companies, categories] = await Promise.all([
        prisma.userProgress.findMany({
          where: { userId: user.id },
          select: { questionId: true, status: true },
        }),
        companiesPromise,
        categoriesPromise,
      ]);

      const userProgress: Record<string, string> = {};
      userProgressData.forEach((progress) => {
        userProgress[progress.questionId] = progress.status.toLowerCase();
      });

      return NextResponse.json({ companies, categories, userProgress }, { status: 200 });
    }

    const query = searchParams.get("query") || "";
    const category = searchParams.get("category");
    const company = searchParams.get("company");

    const whereClause: QuestionWhereInput = {};
    if (category && category !== "all") {
      whereClause.categories = { some: { slug: category } };
    }
    if (company) {
      whereClause.companyTag = { some: { slug: company } };
    }
    if (query) {
      whereClause.title = { contains: query, mode: "insensitive" };
    }

    const questions = await prisma.question.findMany({
      where: whereClause,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        difficulty: true,
        externalPlatformUrl: true,
        solutionUrl: true,
        categories: { select: { name: true, slug: true } },
        companyTag: { select: { name: true, slug: true, logo: true } },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(questions, { status: 200 });
  } catch (error) {
    console.error("GET QUESTIONS ERROR:", error);
    return NextResponse.json("Failed to fetch questions", { status: 500 });
  }
}
/**
 * /api/questions/category
 * @description
 * fetches questions filtered by category and company or query or all questions.
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      difficulty,
      externalPlatformUrl,
      solutionUrl,
      companyTag = [],
      categories = [],
      supportedLanguageIds,
    } = body;

    const user = await currentUser();

    if (!user || user.publicMetadata.role !== "admin") {
      return NextResponse.json("Unauthorized!", { status: 401 });
    }

    if (
      [title, description, externalPlatformUrl, solutionUrl, difficulty].some(
        (t) => typeof t !== "string" || !t.trim()
      )
    ) {
      return NextResponse.json("All fields required!", { status: 400 });
    }

    if (!Array.isArray(companyTag) || companyTag.length === 0) {
      return NextResponse.json("At least one Company tag is required!", { status: 400 });
    }

    if (!Array.isArray(categories)) {
      return NextResponse.json("Categories must be a list!", { status: 400 });
    }

    if (
      supportedLanguageIds !== undefined &&
      (!Array.isArray(supportedLanguageIds) ||
        supportedLanguageIds.length === 0 ||
        supportedLanguageIds.some(
          (id: unknown) => typeof id !== "string" || !id.trim()
        ) ||
        new Set(supportedLanguageIds).size !== supportedLanguageIds.length)
    ) {
      return NextResponse.json(
        "Select at least one unique supported language.",
        { status: 400 }
      );
    }

    const availableLanguages = await prisma.language.findMany({
      where: { isSupported: true },
      select: { id: true },
    });
    const selectedLanguageIds: string[] =
      supportedLanguageIds ?? availableLanguages.map((language) => language.id);
    if (
      selectedLanguageIds.length === 0 ||
      selectedLanguageIds.some(
        (id) => !availableLanguages.some((language) => language.id === id)
      )
    ) {
      return NextResponse.json(
        "One or more selected languages are unavailable.",
        { status: 400 }
      );
    }

    const rawSlug = generateSlug(title);
    const uniqueId = `${rawSlug}-${nanoid(5)}`;

    const question = await prisma.question.create({
      data: {
        slug: uniqueId,
        title,
        description,
        externalPlatformUrl,
        solutionUrl,
        difficulty,
        categories: {
          connect: categories.map((cat: string) => ({
            slug: cat,
          })),
        },
        companyTag: {
          connect: companyTag.map((comp: string) => ({
            slug: comp,
          })),
        },
        supportedLanguages: {
          connect: selectedLanguageIds.map((id) => ({ id })),
        },
      },
    });
    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error(error);
    console.error("CREATE QUESTION ERROR:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          "Invalid Category or Company tag provided (does not exist in DB).",
          { status: 400 }
        );
      }
    }
    return NextResponse.json("Failed to add this question.", { status: 500 });
  }
}
/**
 * /api/questions
 * @description
 * creates a new single question.
 */

export async function DELETE(request: Request) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== "admin") {
      return NextResponse.json("Unauthorized!", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("questionId");
    if (!id || typeof id !== "string") return NextResponse.json("No question.", { status: 404 });
    await prisma.$transaction(async (transaction) => {
      await transaction.customChecker.deleteMany({ where: { questionId: id } });
      await transaction.question.delete({ where: { id } });
    });

    return NextResponse.json("Question deleted!", { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json("No such question found!", { status: 404 });
      }
    }
    console.error(error);
    return NextResponse.json("Failed to delete question", { status: 500 });
  }
}
/**
 * /api/questions
 * @description
 * deletes a single question.
 */

export async function PATCH(request: Request) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== "admin") {
      return NextResponse.json("Unauthorized!", { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const id = searchParams.get("questionId");
    if (!id || typeof id !== "string") {
      return NextResponse.json("No question provided!", { status: 400 });
    }

    const body = await request.json();

    const {
      title,
      description,
      difficulty,
      externalPlatformUrl,
      solutionUrl,
      categories = [],
      companyTag = [],
      supportedLanguageIds,
      timeLimit,
      memoryLimit,
      judgeType,
      hasChecker,
    } = body;

    if (
      [title, description, difficulty, externalPlatformUrl, solutionUrl].some(
        (t) => typeof t !== "string" || !t.trim()
      )
    ) {
      return NextResponse.json("All fields are required!", { status: 400 });
    }

    if (!Array.isArray(companyTag) || companyTag.length === 0) {
      return NextResponse.json("At least one Company tag is required!", { status: 400 });
    }

    if (!Array.isArray(categories)) {
      return NextResponse.json("Categories must be a list!", { status: 400 });
    }
    if (
      supportedLanguageIds !== undefined &&
      (!Array.isArray(supportedLanguageIds) ||
        supportedLanguageIds.length === 0 ||
        supportedLanguageIds.some(
          (languageId: unknown) =>
            typeof languageId !== "string" || !languageId.trim()
        ) ||
        new Set(supportedLanguageIds).size !== supportedLanguageIds.length)
    ) {
      return NextResponse.json(
        "Select at least one unique supported language.",
        { status: 400 }
      );
    }
    if (
      (timeLimit !== undefined &&
        (!Number.isInteger(timeLimit) || timeLimit <= 0)) ||
      (memoryLimit !== undefined &&
        (!Number.isInteger(memoryLimit) || memoryLimit <= 0)) ||
      (judgeType !== undefined &&
        !Object.values(JudgeType).includes(judgeType)) ||
      (hasChecker !== undefined && typeof hasChecker !== "boolean")
    ) {
      return NextResponse.json("Invalid question configuration!", { status: 400 });
    }

    const oldQuestion = await prisma.question.findUnique({
      where: { id },
      select: { title: true, slug: true },
    });

    if (!oldQuestion) {
      return NextResponse.json("Question not found!", { status: 404 });
    }

    let selectedLanguageIds: string[] | undefined;
    if (supportedLanguageIds !== undefined) {
      if (
        !Array.isArray(supportedLanguageIds) ||
        supportedLanguageIds.length === 0 ||
        supportedLanguageIds.some(
          (languageId: unknown) =>
            typeof languageId !== "string" || !languageId.trim()
        ) ||
        new Set(supportedLanguageIds).size !== supportedLanguageIds.length
      ) {
        return NextResponse.json(
          "Select at least one unique supported language.",
          { status: 400 }
        );
      }
      const availableLanguages = await prisma.language.findMany({
        where: { isSupported: true },
        select: { id: true },
      });
      selectedLanguageIds = supportedLanguageIds as string[];
      if (
        selectedLanguageIds.some(
          (languageId) =>
            !availableLanguages.some((language) => language.id === languageId)
        )
      ) {
        return NextResponse.json(
          "One or more selected languages are unavailable.",
          { status: 400 }
        );
      }
    }

    let finalSlug = oldQuestion.slug;
    if (title.trim() !== oldQuestion.title) {
      const rawSlug = generateSlug(title);
      finalSlug = `${rawSlug}-${nanoid(5)}`;
    }

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        title,
        description,
        difficulty,
        externalPlatformUrl,
        solutionUrl,
        slug: finalSlug,
        ...(timeLimit !== undefined ? { timeLimit } : {}),
        ...(memoryLimit !== undefined ? { memoryLimit } : {}),
        ...(judgeType !== undefined ? { judgeType } : {}),
        ...(hasChecker !== undefined ? { hasChecker } : {}),
        companyTag: {
          set: companyTag.map((ct) => ({
            slug: ct,
          })),
        },
        categories: {
          set: categories.map((cat) => ({
            slug: cat,
          })),
        },
        ...(selectedLanguageIds
          ? {
              supportedLanguages: {
                set: selectedLanguageIds.map((languageId) => ({ id: languageId })),
              },
            }
          : {}),
      },
    });

    return NextResponse.json(updatedQuestion, { status: 200 });
  } catch (error) {
    console.error("UPDATE QUESTION ERROR:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json("Invalid Category or Company tag provided.", { status: 400 });
      }
    }
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
/**
 * /api/questions
 * @description
 * updates a single question metadata.
 */