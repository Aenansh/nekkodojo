import { JudgeType } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

const MAX_SOURCE_BYTES = 512 * 1024;
const MAX_INPUT_BYTES = 256 * 1024;
const MAX_TESTCASE_BATCH_BYTES = 8 * 1024 * 1024;
const MAX_TESTCASES = 500;

export type ExecutionBundle = NonNullable<
  Awaited<ReturnType<typeof loadExecutionBundle>>
>;

export async function loadExecutionBundle(
  questionId: string,
  languageId: string,
  options: { requireTestcases?: boolean } = {}
) {
  const [question, language] = await Promise.all([
    prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        timeLimit: true,
        memoryLimit: true,
        judgeType: true,
        hasChecker: true,
        supportedLanguages: {
          where: { id: languageId, isSupported: true },
          select: { id: true },
        },
        codestubs: {
          where: { languageId },
          select: { driverCode: true },
          take: 1,
        },
      },
    }),
    prisma.language.findUnique({
      where: { id: languageId },
      select: {
        id: true,
        name: true,
        extension: true,
        dockerImage: true,
        compileCmd: true,
        runCmd: true,
        isSupported: true,
      },
    }),
  ]);

  if (!question) throw new Error("Question not found");
  if (!language || !language.isSupported) {
    throw new Error("Language is not available");
  }
  if (question.supportedLanguages.length === 0) {
    throw new Error("Language is not supported for this question");
  }
  if (!question.codestubs[0]) {
    throw new Error("Code stub is not configured for this question and language");
  }
  if (!language.dockerImage.trim() || !language.runCmd.trim()) {
    throw new Error("Language container image and run command must be configured");
  }
  const testcases =
    options.requireTestcases === false
      ? []
      : await prisma.testcase.findMany({
          where: { questionId },
          select: {
            id: true,
            input: true,
            expectedOutput: true,
          },
          orderBy: { id: "asc" },
        });

  if (options.requireTestcases !== false) {
    if (testcases.length === 0 || testcases.length > MAX_TESTCASES) {
      throw new Error(`Question must have between 1 and ${MAX_TESTCASES} testcases`);
    }
    if (
      testcases.some(
        (testcase) =>
          Buffer.byteLength(testcase.input, "utf8") > MAX_INPUT_BYTES ||
          Buffer.byteLength(testcase.expectedOutput, "utf8") > MAX_INPUT_BYTES
      )
    ) {
      throw new Error("A testcase exceeds the 256 KiB input or output limit");
    }
    const testcaseBatchBytes = testcases.reduce(
      (total, testcase) =>
        total +
        Buffer.byteLength(testcase.input, "utf8") +
        Buffer.byteLength(testcase.expectedOutput, "utf8"),
      0
    );
    if (testcaseBatchBytes > MAX_TESTCASE_BATCH_BYTES) {
      throw new Error("Question testcase batch exceeds the 8 MiB total limit");
    }
  }
  const { codestubs, ...questionData } = question;
  return {
    question: { ...questionData, testcases },
    language,
    codestub: codestubs[0],
  };
}

export function buildProgramSource(
  sourceCode: string,
  driverCode: string
): string {
  const placeholder = "//USER_CODE";
  const placeholderIndex = driverCode.indexOf(placeholder);
  if (
    placeholderIndex === -1 ||
    driverCode.indexOf(placeholder, placeholderIndex + placeholder.length) !== -1
  ) {
    throw new Error("Driver code must contain exactly one //USER_CODE placeholder");
  }
  if (
    Buffer.byteLength(sourceCode, "utf8") === 0 ||
    Buffer.byteLength(
      driverCode.replace(placeholder, () => sourceCode),
      "utf8"
    ) > MAX_SOURCE_BYTES
  ) {
    throw new Error("Composed program source must be non-empty and at most 512 KiB");
  }
  return driverCode.replace(placeholder, () => sourceCode);
}

export function getSourceFile(extension: string) {
  const normalized = extension.replace(/^\./, "");
  if (!/^[A-Za-z0-9]+$/.test(normalized)) {
    throw new Error("Language extension must contain only letters and numbers");
  }
  return `/workspace/Main.${normalized}`;
}

export function validateRunInput(input: string) {
  if (Buffer.byteLength(input, "utf8") > MAX_INPUT_BYTES) {
    throw new Error("Run input exceeds the 256 KiB limit");
  }
}

export function outputsMatch(
  judgeType: string,
  actualOutput: string,
  expectedOutput: string
) {
  const actual = actualOutput.replace(/\r\n/g, "\n");
  const expected = expectedOutput.replace(/\r\n/g, "\n");
  if (judgeType === JudgeType.EXACT_MATCH) return actual === expected;
  if (judgeType === JudgeType.UNORDERED_MATCH) {
    const sortedTokens = (value: string) =>
      value.trim().split(/\s+/).filter(Boolean).sort().join("\n");
    return sortedTokens(actual) === sortedTokens(expected);
  }
  return false;
}
