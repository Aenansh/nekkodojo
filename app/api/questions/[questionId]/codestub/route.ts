import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ questionId: string }>;
};

type CodestubPayload = {
  languageId: string;
  userSnippet?: string;
  driverCode?: string;
};

function isCodestubPayload(body: unknown): body is CodestubPayload {
  return (
    typeof body === "object" &&
    body !== null &&
    "languageId" in body &&
    typeof body.languageId === "string" &&
    body.languageId.length > 0 &&
    (!("userSnippet" in body) || typeof body.userSnippet === "string") &&
    (!("driverCode" in body) || typeof body.driverCode === "string")
  );
}

async function isAdmin() {
  const user = await currentUser();
  return Boolean(user && user.publicMetadata.role === "admin");
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { questionId } = await params;
    const isAdminUser = await isAdmin();
    const languageId = new URL(request.url).searchParams.get("languageId");

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true },
    });

    if (!question) {
      return NextResponse.json("Question not found", { status: 404 });
    }

    const codestubs = await prisma.codestub.findMany({
      where: {
        questionId,
        ...(languageId ? { languageId } : {}),
      },
      select: {
        id: true,
        questionId: true,
        languageId: true,
        userSnippet: true,
        ...(isAdminUser ? { driverCode: true } : {}),
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
    });

    if (languageId) {
      const codestub = codestubs[0];
      if (!codestub) {
        return NextResponse.json("Codestub not found", { status: 404 });
      }
      return NextResponse.json(codestub, { status: 200 });
    }

    return NextResponse.json(codestubs, { status: 200 });
  } catch (error) {
    console.error("[QUESTION_CODESTUB_GET]", error);
    return NextResponse.json("Failed to fetch codestubs", { status: 500 });
  }
}
/**
 * /api/questions/[questionId]/codestub
 * @description
 * fetches code stubs for a question, optionally filtered by languageId; includes driver code only for administrators.
 */

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
      !isCodestubPayload(body) ||
      typeof body.userSnippet !== "string" ||
      typeof body.driverCode !== "string"
    ) {
      return NextResponse.json(
        "languageId, userSnippet, and driverCode are required",
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

    const codestub = await prisma.codestub.create({
      data: {
        questionId,
        languageId: body.languageId,
        userSnippet: body.userSnippet,
        driverCode: body.driverCode,
      },
      include: { language: true },
    });

    return NextResponse.json(codestub, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        "A codestub already exists for this question and language",
        { status: 409 }
      );
    }
    console.error("[QUESTION_CODESTUB_POST]", error);
    return NextResponse.json("Failed to create codestub", { status: 500 });
  }
}
/**
 * /api/questions/[questionId]/codestub
 * @description
 * creates a code stub with its user snippet and driver code for administrators.
 */

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

    if (!isCodestubPayload(body)) {
      return NextResponse.json("languageId is required", { status: 400 });
    }

    const data: { userSnippet?: string; driverCode?: string } = {};
    if (typeof body.userSnippet === "string") data.userSnippet = body.userSnippet;
    if (typeof body.driverCode === "string") data.driverCode = body.driverCode;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        "At least one of userSnippet or driverCode is required",
        { status: 400 }
      );
    }

    const result = await prisma.codestub.updateMany({
      where: { questionId, languageId: body.languageId },
      data,
    });

    if (result.count === 0) {
      return NextResponse.json("Codestub not found", { status: 404 });
    }

    const codestub = await prisma.codestub.findUnique({
      where: {
        questionId_languageId: {
          questionId,
          languageId: body.languageId,
        },
      },
      include: { language: true },
    });

    return NextResponse.json(codestub, { status: 200 });
  } catch (error) {
    console.error("[QUESTION_CODESTUB_PATCH]", error);
    return NextResponse.json("Failed to update codestub", { status: 500 });
  }
}
/**
 * /api/questions/[questionId]/codestub
 * @description
 * updates the user snippet or driver code for a question's language-specific code stub.
 */

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json("Unauthorized!", { status: 401 });
    }

    const { questionId } = await params;
    const languageId = new URL(request.url).searchParams.get("languageId");
    if (!languageId) {
      return NextResponse.json("languageId is required", { status: 400 });
    }

    const result = await prisma.codestub.deleteMany({
      where: { questionId, languageId },
    });
    if (result.count === 0) {
      return NextResponse.json("Codestub not found", { status: 404 });
    }
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    console.error("[QUESTION_CODESTUB_DELETE]", error);
    return NextResponse.json("Failed to delete codestub", { status: 500 });
  }
}
/**
 * /api/questions/[questionId]/codestub
 * @description
 * deletes a question's code stub selected by the languageId query parameter.
 */
