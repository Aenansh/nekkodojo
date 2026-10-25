import { currentUser } from "@clerk/nextjs/server";
import { Difficulty, JudgeType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type BulkTestcase = {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
};

type BulkCodestub = {
  languageId?: string;
  languageSlug?: string;
  userSnippet: string;
  driverCode: string;
};

type BulkCustomChecker = {
  languageId?: string;
  languageSlug?: string;
  scriptSource: string;
  timeoutMs?: number;
};

type BulkQuestion = {
  title: string;
  slug: string;
  description: string;
  constraints?: string | null;
  difficulty?: Difficulty;
  externalPlatformUrl: string;
  solutionUrl: string;
  categories?: string[];
  companies?: string[];
  supportedLanguageIds?: string[];
  timeLimit?: number;
  memoryLimit?: number;
  judgeType?: JudgeType;
  hasChecker?: boolean;
  testcases?: BulkTestcase[];
  codestubs?: BulkCodestub[];
  customChecker?: BulkCustomChecker;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && typeof value === "number" && value > 0;
}

function parseBulkQuestion(value: unknown): BulkQuestion | string {
  if (!isRecord(value)) return "Question entry must be an object";

  const {
    title,
    slug,
    description,
    constraints,
    difficulty,
    externalPlatformUrl,
    solutionUrl,
    categories,
    companies,
    supportedLanguageIds,
    timeLimit,
    memoryLimit,
    judgeType,
    hasChecker,
    testcases,
    codestubs,
    customChecker,
  } = value;

  if (
    !isNonEmptyString(title) ||
    !isNonEmptyString(slug) ||
    !isNonEmptyString(description) ||
    !isNonEmptyString(externalPlatformUrl) ||
    !isNonEmptyString(solutionUrl)
  ) {
    return "title, slug, description, externalPlatformUrl, and solutionUrl are required";
  }
  if (
    difficulty !== undefined &&
    !Object.values(Difficulty).includes(difficulty as Difficulty)
  ) {
    return "difficulty must be Easy, Medium, or Hard";
  }
  if (constraints !== undefined && constraints !== null && typeof constraints !== "string") {
    return "constraints must be a string or null";
  }
  if (categories !== undefined && !isStringArray(categories)) {
    return "categories must be an array of category slugs";
  }
  if (companies !== undefined && !isStringArray(companies)) {
    return "companies must be an array of company slugs";
  }
  if (
    supportedLanguageIds !== undefined &&
    (!isStringArray(supportedLanguageIds) ||
      supportedLanguageIds.length === 0 ||
      new Set(supportedLanguageIds).size !== supportedLanguageIds.length)
  ) {
    return "supportedLanguageIds must be a non-empty array of unique language IDs";
  }
  if (timeLimit !== undefined && !isPositiveInteger(timeLimit)) {
    return "timeLimit must be a positive integer";
  }
  if (memoryLimit !== undefined && !isPositiveInteger(memoryLimit)) {
    return "memoryLimit must be a positive integer";
  }
  if (
    judgeType !== undefined &&
    !Object.values(JudgeType).includes(judgeType as JudgeType)
  ) {
    return "judgeType is invalid";
  }
  if (hasChecker !== undefined && typeof hasChecker !== "boolean") {
    return "hasChecker must be a boolean";
  }
  if (testcases !== undefined) {
    if (
      !Array.isArray(testcases) ||
      !testcases.every(
        (testcase) =>
          isRecord(testcase) &&
          typeof testcase.input === "string" &&
          typeof testcase.expectedOutput === "string" &&
          (testcase.isHidden === undefined || typeof testcase.isHidden === "boolean")
      )
    ) {
      return "testcases must be an array of { input, expectedOutput, isHidden? } objects";
    }
  }
  if (codestubs !== undefined) {
    if (
      !Array.isArray(codestubs) ||
      !codestubs.every(
        (codestub) =>
          isRecord(codestub) &&
          (isNonEmptyString(codestub.languageId) ||
            isNonEmptyString(codestub.languageSlug)) &&
          typeof codestub.userSnippet === "string" &&
          typeof codestub.driverCode === "string"
      )
    ) {
      return "codestubs must include languageId or languageSlug, userSnippet, and driverCode";
    }
  }
  if (customChecker !== undefined) {
    if (
      !isRecord(customChecker) ||
      (!isNonEmptyString(customChecker.languageId) &&
        !isNonEmptyString(customChecker.languageSlug)) ||
      !isNonEmptyString(customChecker.scriptSource) ||
      (customChecker.timeoutMs !== undefined &&
        !isPositiveInteger(customChecker.timeoutMs))
    ) {
      return "customChecker must include languageId or languageSlug and scriptSource, with an optional positive integer timeoutMs";
    }
  }

  return {
    title,
    slug,
    description,
    constraints:
      typeof constraints === "string" && !constraints.trim()
        ? null
        : (constraints as string | null | undefined),
    difficulty: difficulty as Difficulty | undefined,
    externalPlatformUrl,
    solutionUrl,
    categories: categories as string[] | undefined,
    companies: companies as string[] | undefined,
    supportedLanguageIds: supportedLanguageIds as string[] | undefined,
    timeLimit: timeLimit as number | undefined,
    memoryLimit: memoryLimit as number | undefined,
    judgeType: judgeType as JudgeType | undefined,
    hasChecker: hasChecker as boolean | undefined,
    testcases: testcases as BulkTestcase[] | undefined,
    codestubs: codestubs as BulkCodestub[] | undefined,
    customChecker: customChecker as BulkCustomChecker | undefined,
  };
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== "admin") {
      return NextResponse.json("Unauthorized!", { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json("Invalid JSON body", { status: 400 });
    }

    if (!Array.isArray(body)) {
      return NextResponse.json("Payload must be an array", { status: 400 });
    }

    const stats = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const [index, rawQuestion] of body.entries()) {
      const question = parseBulkQuestion(rawQuestion);
      if (typeof question === "string") {
        stats.failed++;
        stats.errors.push(`Question ${index + 1}: ${question}`);
        continue;
      }

      try {
        await prisma.$transaction(async (transaction) => {
          const globallySupportedLanguages = await transaction.language.findMany({
            where: { isSupported: true },
            select: { id: true, slug: true },
          });
          const existingQuestion = await transaction.question.findUnique({
            where: { slug: question.slug },
            select: {
              supportedLanguages: {
                where: { isSupported: true },
                select: { id: true },
              },
            },
          });
          const effectiveLanguageIds =
            question.supportedLanguageIds ??
            (existingQuestion?.supportedLanguages.length
              ? existingQuestion.supportedLanguages.map((language) => language.id)
              : globallySupportedLanguages.map((language) => language.id));
          if (
            effectiveLanguageIds.length === 0 ||
            effectiveLanguageIds.some(
              (languageId) =>
                !globallySupportedLanguages.some(
                  (language) => language.id === languageId
                )
            )
          ) {
            throw new Error(
              "supportedLanguageIds contains an unknown or globally unsupported language"
            );
          }

          const savedQuestion = await transaction.question.upsert({
            where: { slug: question.slug },
            update: {
              title: question.title,
              description: question.description,
              ...(question.constraints !== undefined
                ? { constraints: question.constraints }
                : {}),
              ...(question.difficulty !== undefined
                ? { difficulty: question.difficulty }
                : {}),
              externalPlatformUrl: question.externalPlatformUrl,
              solutionUrl: question.solutionUrl,
              ...(question.timeLimit !== undefined
                ? { timeLimit: question.timeLimit }
                : {}),
              ...(question.memoryLimit !== undefined
                ? { memoryLimit: question.memoryLimit }
                : {}),
              ...(question.judgeType !== undefined
                ? { judgeType: question.judgeType }
                : {}),
              ...(question.hasChecker !== undefined
                ? { hasChecker: question.hasChecker }
                : {}),
              ...(question.categories !== undefined
                ? {
                    categories: {
                      set: question.categories.map((slug) => ({ slug })),
                    },
                  }
                : {}),
              ...(question.companies !== undefined
                ? {
                    companyTag: {
                      set: question.companies.map((slug) => ({ slug })),
                    },
                  }
                : {}),
              ...(question.supportedLanguageIds !== undefined
                ? {
                    supportedLanguages: {
                      set: effectiveLanguageIds.map((id) => ({ id })),
                    },
                  }
                : {}),
            },
            create: {
              title: question.title,
              slug: question.slug,
              description: question.description,
              constraints: question.constraints ?? null,
              difficulty: question.difficulty ?? "Medium",
              externalPlatformUrl: question.externalPlatformUrl,
              solutionUrl: question.solutionUrl,
              ...(question.timeLimit !== undefined
                ? { timeLimit: question.timeLimit }
                : {}),
              ...(question.memoryLimit !== undefined
                ? { memoryLimit: question.memoryLimit }
                : {}),
              ...(question.judgeType !== undefined
                ? { judgeType: question.judgeType }
                : {}),
              ...(question.hasChecker !== undefined
                ? { hasChecker: question.hasChecker }
                : {}),
              categories: {
                connect: (question.categories ?? []).map((slug) => ({ slug })),
              },
              companyTag: {
                connect: (question.companies ?? []).map((slug) => ({ slug })),
              },
              supportedLanguages: {
                connect: effectiveLanguageIds.map((id) => ({ id })),
              },
            },
            select: { id: true },
          });

          if (question.testcases !== undefined) {
            await transaction.testcase.deleteMany({
              where: { questionId: savedQuestion.id },
            });
            if (question.testcases.length > 0) {
              await transaction.testcase.createMany({
                data: question.testcases.map((testcase) => ({
                  questionId: savedQuestion.id,
                  input: testcase.input,
                  expectedOutput: testcase.expectedOutput,
                  isHidden: testcase.isHidden ?? false,
                })),
              });
            }
          }
          if (question.codestubs !== undefined) {
            const resolvedCodestubs = question.codestubs.map((codestub) => {
              const language = globallySupportedLanguages.find(
                (supported) =>
                  supported.id === codestub.languageId ||
                  supported.slug === codestub.languageSlug
              );
              if (!language) {
                throw new Error(
                  `Unknown or unsupported language "${codestub.languageSlug ?? codestub.languageId}"`
                );
              }
              return { ...codestub, languageId: language.id };
            });
            const uniqueLanguageIds = new Set(
              resolvedCodestubs.map((codestub) => codestub.languageId)
            );
            if (uniqueLanguageIds.size !== resolvedCodestubs.length) {
              throw new Error("codestubs contains duplicate language entries");
            }
            if (
              resolvedCodestubs.some(
                (codestub) => !effectiveLanguageIds.includes(codestub.languageId)
              )
            ) {
              throw new Error(
                "codestubs contains a language not selected for this question"
              );
            }

            const missingLanguages = globallySupportedLanguages.filter(
              (language) =>
                effectiveLanguageIds.includes(language.id) &&
                !uniqueLanguageIds.has(language.id)
            );
            if (missingLanguages.length > 0) {
              throw new Error(
                `codestubs is missing supported languages: ${missingLanguages
                  .map((language) => language.slug)
                  .join(", ")}`
              );
            }

            for (const codestub of resolvedCodestubs) {
              await transaction.codestub.upsert({
                where: {
                  questionId_languageId: {
                    questionId: savedQuestion.id,
                    languageId: codestub.languageId,
                  },
                },
                update: {
                  userSnippet: codestub.userSnippet,
                  driverCode: codestub.driverCode,
                },
                create: {
                  questionId: savedQuestion.id,
                  languageId: codestub.languageId,
                  userSnippet: codestub.userSnippet,
                  driverCode: codestub.driverCode,
                },
              });
            }
          }

          if (question.customChecker !== undefined) {
            const checkerLanguage = globallySupportedLanguages.find(
              (language) =>
                language.id === question.customChecker?.languageId ||
                language.slug === question.customChecker?.languageSlug
            );
            if (!checkerLanguage) {
              throw new Error(
                `Unknown or unsupported custom checker language "${question.customChecker.languageSlug ?? question.customChecker.languageId}"`
              );
            }

            const latestChecker = await transaction.customChecker.findFirst({
              where: { questionId: savedQuestion.id },
              orderBy: { version: "desc" },
              select: { id: true, version: true },
            });

            if (latestChecker) {
              await transaction.customChecker.update({
                where: { id: latestChecker.id },
                data: {
                  languageId: checkerLanguage.id,
                  scriptSource: question.customChecker.scriptSource,
                  timeoutMs: question.customChecker.timeoutMs ?? 2000,
                },
              });
            } else {
              await transaction.customChecker.create({
                data: {
                  questionId: savedQuestion.id,
                  languageId: checkerLanguage.id,
                  scriptSource: question.customChecker.scriptSource,
                  timeoutMs: question.customChecker.timeoutMs ?? 2000,
                  version: 1,
                },
              });
            }

            await transaction.question.update({
              where: { id: savedQuestion.id },
              data: { hasChecker: true },
            });
          }
        });

        stats.success++;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error uploading ${question.slug}:`, error);
        stats.failed++;
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2025"
        ) {
          stats.errors.push(
            `Failed: ${question.slug} - Missing Category, Company, or related language in DB`
          );
        } else {
          stats.errors.push(`Failed: ${question.slug} - ${message}`);
        }
      }
    }

    return NextResponse.json(
      {
        message: `Processed. Success: ${stats.success}, Failed: ${stats.failed}`,
        data: stats.errors,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("FATAL BULK UPLOAD ERROR:", error);
    return NextResponse.json({ error: "Server crashed during upload." }, { status: 500 });
  }
}
/**
 * /api/questions/bulk
 * @description
 * creates or updates multiple questions and their optional categories, companies, languages, testcases, codestubs, and custom checkers for administrators.
 */
