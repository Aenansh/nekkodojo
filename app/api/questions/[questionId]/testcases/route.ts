import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type TestcasePayload = {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;
    if (!questionId) {
      return NextResponse.json("Question ID is required", { status: 400 });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true },
    });

    if (!question) {
      return NextResponse.json("Question not found", { status: 404 });
    }

    const user = await currentUser();
    const isAdmin = user?.publicMetadata.role === "admin";
    const testcases = await prisma.testcase.findMany({
      where: {
        questionId,
        ...(isAdmin ? {} : { isHidden: false }),
      },
      select: {
        id: true,
        input: true,
        expectedOutput: true,
        isHidden: true,
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(testcases, { status: 200 });
  } catch (error) {
    console.error("[QUESTION_TESTCASES_GET]", error);
    return NextResponse.json("Failed to fetch testcases", { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== "admin") {
      return NextResponse.json("Unauthorized!", { status: 401 });
    }

    const { questionId } = await params;
    if (!questionId) {
      return NextResponse.json("Question ID is required", { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json("Invalid JSON body", { status: 400 });
    }

    const testcases = Array.isArray(body)
      ? body
      : typeof body === "object" && body !== null && "testcases" in body
        ? body.testcases
        : undefined;

    if (!Array.isArray(testcases) || testcases.length === 0) {
      return NextResponse.json(
        "Provide a non-empty testcases array",
        { status: 400 }
      );
    }

    const validTestcases = testcases.every(
      (testcase): testcase is TestcasePayload =>
        typeof testcase === "object" &&
        testcase !== null &&
        "input" in testcase &&
        typeof testcase.input === "string" &&
        "expectedOutput" in testcase &&
        typeof testcase.expectedOutput === "string" &&
        (!("isHidden" in testcase) || typeof testcase.isHidden === "boolean")
    );

    if (!validTestcases) {
      return NextResponse.json(
        "Each testcase must include string input and expectedOutput fields, and an optional boolean isHidden field",
        { status: 400 }
      );
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true },
    });

    if (!question) {
      return NextResponse.json("Question not found", { status: 404 });
    }

    const result = await prisma.testcase.createMany({
      data: testcases.map((testcase) => ({
        questionId,
        input: testcase.input,
        expectedOutput: testcase.expectedOutput,
        isHidden: testcase.isHidden ?? false,
      })),
    });

    return NextResponse.json(
      { questionId, createdCount: result.count },
      { status: 201 }
    );
  } catch (error) {
    console.error("[QUESTION_TESTCASES_POST]", error);
    return NextResponse.json("Failed to add testcases", { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== "admin") {
      return NextResponse.json("Unauthorized!", { status: 401 });
    }

    const { questionId } = await params;
    const body: unknown = await request.json().catch(() => null);
    if (
      typeof body !== "object" ||
      body === null ||
      !("testcaseId" in body) ||
      typeof body.testcaseId !== "string" ||
      (!("input" in body) && !("expectedOutput" in body) && !("isHidden" in body))
    ) {
      return NextResponse.json("testcaseId and at least one testcase field are required", {
        status: 400,
      });
    }

    const data: { input?: string; expectedOutput?: string; isHidden?: boolean } = {};
    if ("input" in body) {
      if (typeof body.input !== "string") {
        return NextResponse.json("input must be a string", { status: 400 });
      }
      data.input = body.input;
    }
    if ("expectedOutput" in body) {
      if (typeof body.expectedOutput !== "string") {
        return NextResponse.json("expectedOutput must be a string", { status: 400 });
      }
      data.expectedOutput = body.expectedOutput;
    }
    if ("isHidden" in body) {
      if (typeof body.isHidden !== "boolean") {
        return NextResponse.json("isHidden must be a boolean", { status: 400 });
      }
      data.isHidden = body.isHidden;
    }

    const result = await prisma.testcase.updateMany({
      where: { id: body.testcaseId, questionId },
      data,
    });
    if (result.count === 0) {
      return NextResponse.json("Testcase not found", { status: 404 });
    }

    const testcase = await prisma.testcase.findUnique({
      where: { id: body.testcaseId },
      select: { id: true, input: true, expectedOutput: true, isHidden: true },
    });
    return NextResponse.json(testcase, { status: 200 });
  } catch (error) {
    console.error("[QUESTION_TESTCASES_PATCH]", error);
    return NextResponse.json("Failed to update testcase", { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== "admin") {
      return NextResponse.json("Unauthorized!", { status: 401 });
    }

    const { questionId } = await params;
    const testcaseId = new URL(request.url).searchParams.get("testcaseId");
    if (!testcaseId) {
      return NextResponse.json("testcaseId is required", { status: 400 });
    }

    const result = await prisma.testcase.deleteMany({
      where: { id: testcaseId, questionId },
    });
    if (result.count === 0) {
      return NextResponse.json("Testcase not found", { status: 404 });
    }
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    console.error("[QUESTION_TESTCASES_DELETE]", error);
    return NextResponse.json("Failed to delete testcase", { status: 500 });
  }
}
