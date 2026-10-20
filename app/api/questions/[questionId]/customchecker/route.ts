import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ questionId: string }>;
};

type CustomCheckerPayload = {
  languageId?: string;
  scriptSource?: string;
  timeoutMs?: number;
  version?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

async function isAdmin() {
  const user = await currentUser();
  return Boolean(user && user.publicMetadata.role === "admin");
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json("Unauthorized!", { status: 401 });
    }

    const { questionId } = await params;
    const searchParams = new URL(request.url).searchParams;
    const languageId = searchParams.get("languageId");
    const versionParam = searchParams.get("version");
    const version = versionParam === null ? undefined : Number(versionParam);

    if (versionParam !== null && !isPositiveInteger(version)) {
      return NextResponse.json("version must be a positive integer", { status: 400 });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true },
    });

    if (!question) {
      return NextResponse.json("Question not found", { status: 404 });
    }

    const where = {
      questionId,
      ...(languageId ? { languageId } : {}),
      ...(version ? { version } : {}),
    };

    if (version !== undefined) {
      const checker = await prisma.customChecker.findUnique({
        where: { questionId_version: { questionId, version } },
        include: { language: true },
      });

      if (!checker || (languageId && checker.languageId !== languageId)) {
        return NextResponse.json("Custom checker not found", { status: 404 });
      }
      return NextResponse.json(checker, { status: 200 });
    }

    const checkers = await prisma.customChecker.findMany({
      where,
      include: { language: true },
      orderBy: { version: "desc" },
    });

    return NextResponse.json(checkers, { status: 200 });
  } catch (error) {
    console.error("[QUESTION_CUSTOM_CHECKER_GET]", error);
    return NextResponse.json("Failed to fetch custom checker", { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json("Unauthorized!", { status: 401 });
    }

    const { questionId } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json("Invalid JSON body", { status: 400 });
    }

    if (
      !isRecord(body) ||
      typeof body.languageId !== "string" ||
      body.languageId.length === 0 ||
      typeof body.scriptSource !== "string" ||
      body.scriptSource.trim().length === 0 ||
      (body.timeoutMs !== undefined && !isPositiveInteger(body.timeoutMs))
    ) {
      return NextResponse.json(
        "languageId and non-empty scriptSource are required; timeoutMs must be a positive integer",
        { status: 400 }
      );
    }

    const [question, language] = await Promise.all([
      prisma.question.findUnique({
        where: { id: questionId },
        select: { id: true },
      }),
      prisma.language.findUnique({
        where: { id: body.languageId },
        select: { id: true },
      }),
    ]);

    if (!question) {
      return NextResponse.json("Question not found", { status: 404 });
    }
    if (!language) {
      return NextResponse.json("Language not found", { status: 404 });
    }

    const latest = await prisma.customChecker.aggregate({
      where: { questionId },
      _max: { version: true },
    });
    const nextVersion = (latest._max.version ?? 0) + 1;

    const checker = await prisma.customChecker.create({
      data: {
        questionId,
        languageId: body.languageId,
        scriptSource: body.scriptSource,
        timeoutMs: body.timeoutMs ?? 2000,
        version: nextVersion,
      },
      include: { language: true },
    });

    return NextResponse.json(checker, { status: 201 });
  } catch (error) {
    console.error("[QUESTION_CUSTOM_CHECKER_POST]", error);
    return NextResponse.json("Failed to create custom checker", { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json("Unauthorized!", { status: 401 });
    }

    const { questionId } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json("Invalid JSON body", { status: 400 });
    }

    if (!isRecord(body) || !isPositiveInteger(body.version)) {
      return NextResponse.json("A positive integer version is required", {
        status: 400,
      });
    }

    const data: Pick<CustomCheckerPayload, "scriptSource" | "timeoutMs"> = {};
    if (body.scriptSource !== undefined) {
      if (
        typeof body.scriptSource !== "string" ||
        body.scriptSource.trim().length === 0
      ) {
        return NextResponse.json("scriptSource must be a non-empty string", {
          status: 400,
        });
      }
      data.scriptSource = body.scriptSource;
    }
    if (body.timeoutMs !== undefined) {
      if (!isPositiveInteger(body.timeoutMs)) {
        return NextResponse.json("timeoutMs must be a positive integer", {
          status: 400,
        });
      }
      data.timeoutMs = body.timeoutMs;
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        "Provide scriptSource or timeoutMs to update",
        { status: 400 }
      );
    }

    const result = await prisma.customChecker.updateMany({
      where: { questionId, version: body.version },
      data,
    });

    if (result.count === 0) {
      return NextResponse.json("Custom checker not found", { status: 404 });
    }

    const checker = await prisma.customChecker.findUnique({
      where: {
        questionId_version: { questionId, version: body.version },
      },
      include: { language: true },
    });

    return NextResponse.json(checker, { status: 200 });
  } catch (error) {
    console.error("[QUESTION_CUSTOM_CHECKER_PATCH]", error);
    return NextResponse.json("Failed to update custom checker", { status: 500 });
  }
}
