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
