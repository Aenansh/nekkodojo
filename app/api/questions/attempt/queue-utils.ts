import { prisma } from "@/lib/prisma";
import { buildProgramSource } from "@/trigger/execution-utils";
import { NextResponse } from "next/server";

const MAX_SOURCE_BYTES = 512 * 1024;
const MAX_INPUT_BYTES = 256 * 1024;
const MAX_TESTCASES = 500;

export type AttemptPayload = {
  questionId: string;
  languageId: string;
  sourceCode: string;
  input?: string;
};

type RunAttemptPayload = AttemptPayload & { input: string };
type SubmitAttemptPayload = Omit<AttemptPayload, "input">;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseAttemptPayload(
  value: unknown,
  requireInput: true
): RunAttemptPayload | string;
export function parseAttemptPayload(
  value: unknown,
  requireInput: false
): SubmitAttemptPayload | string;
export function parseAttemptPayload(
  value: unknown,
  requireInput: boolean
): AttemptPayload | string {
  if (
    !isRecord(value) ||
    typeof value.questionId !== "string" ||
    value.questionId.length === 0 ||
    typeof value.languageId !== "string" ||
    value.languageId.length === 0 ||
    typeof value.sourceCode !== "string" ||
    value.sourceCode.trim().length === 0
  ) {
    return requireInput
      ? "questionId, languageId, sourceCode, and input are required"
      : "questionId, languageId, and sourceCode are required";
  }

  const { questionId, languageId, sourceCode } = value;
  if (Buffer.byteLength(sourceCode, "utf8") > MAX_SOURCE_BYTES) {
    return "sourceCode must be at most 512 KiB";
  }
  if (requireInput) {
    if (typeof value.input !== "string") {
      return "questionId, languageId, sourceCode, and input are required";
    }
    if (Buffer.byteLength(value.input, "utf8") > MAX_INPUT_BYTES) {
      return "input must be at most 256 KiB";
    }
    return { questionId, languageId, sourceCode, input: value.input };
  }
  if (value.input !== undefined) {
    return "input is only accepted by the run endpoint";
  }

  return { questionId, languageId, sourceCode };
}

export async function validateQuestionAttempt(
  userId: string,
  payload: AttemptPayload,
  requireTestcases: boolean
): Promise<NextResponse | null> {
  const [user, question, language] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    }),
    prisma.question.findUnique({
      where: { id: payload.questionId },
      select: {
        id: true,
        supportedLanguages: {
          where: { id: payload.languageId, isSupported: true },
          select: { id: true },
        },
        codestubs: {
          where: { languageId: payload.languageId },
          select: { driverCode: true },
          take: 1,
        },
      },
    }),
    prisma.language.findUnique({
      where: { id: payload.languageId },
      select: { id: true, isSupported: true },
    }),
  ]);

  if (!user) {
    return NextResponse.json("User profile not found", { status: 404 });
  }
  if (!question) {
    return NextResponse.json("Question not found", { status: 404 });
  }
  if (!language?.isSupported || question.supportedLanguages.length === 0) {
    return NextResponse.json(
      "Language is not supported for this question",
      { status: 400 }
    );
  }
  const codestub = question.codestubs[0];
  if (!codestub) {
    return NextResponse.json(
      "Code stub is not configured for this question and language",
      { status: 400 }
    );
  }

  try {
    buildProgramSource(payload.sourceCode, codestub.driverCode);
  } catch (error) {
    return NextResponse.json(
      error instanceof Error ? error.message : "Program source is invalid",
      { status: 400 }
    );
  }

  if (requireTestcases) {
    const testcaseCount = await prisma.testcase.count({
      where: { questionId: payload.questionId },
    });
    if (testcaseCount === 0 || testcaseCount > MAX_TESTCASES) {
      return NextResponse.json(
        `Question must have between 1 and ${MAX_TESTCASES} testcases`,
        { status: 400 }
      );
    }
  }

  return null;
}
