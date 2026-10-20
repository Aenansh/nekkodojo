import { task } from "@trigger.dev/sdk";
import {
  JudgeType,
  QuestionStatusType,
  ResultType,
} from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import {
  buildProgramSource,
  getSourceFile,
  loadExecutionBundle,
  outputsMatch,
} from "./execution-utils";
import {
  SandboxExecutionError,
  runCommand,
  withSandbox,
  writeSource,
} from "./kubernetes-sandbox";
import {
  submissionQueue,
  type SubmissionJobData,
} from "./queue/submission.queue";

type SubmissionOutcome = {
  result: ResultType;
  testcasesPassed: number;
  totalTestcases: number;
  timeTaken: number;
  memoryUsed: number;
  errorLog: string | null;
};

function failureResult(
  reason: string,
  totalTestcases: number,
  result: ResultType = ResultType.SYSTEM_ERROR
): SubmissionOutcome {
  return {
    result,
    testcasesPassed: 0,
    totalTestcases,
    timeTaken: 0,
    memoryUsed: 0,
    errorLog: reason.slice(0, 16_000),
  };
}

function resultForSandboxError(error: SandboxExecutionError) {
  if (error.reason === "TIME_LIMIT_EXCEEDED") {
    return ResultType.TIME_LIMIT_EXCEEDED;
  }
  if (error.reason === "OUTPUT_LIMIT_EXCEEDED") {
    return ResultType.RUNTIME_ERROR;
  }
  return ResultType.SYSTEM_ERROR;
}

export const submitCodeTask = task({
  id: "submit-code",
  queue: submissionQueue,
  retry: { maxAttempts: 1 },
  run: async (payload: SubmissionJobData) => {
    if (
      !payload ||
      typeof payload.userId !== "string" ||
      !payload.userId ||
      typeof payload.questionId !== "string" ||
      !payload.questionId ||
      typeof payload.languageId !== "string" ||
      !payload.languageId ||
      typeof payload.sourceCode !== "string"
    ) {
      throw new Error("Submission job payload is invalid");
    }

    const { question, language, codestub } = await loadExecutionBundle(
      payload.questionId,
      payload.languageId
    );
    const source = buildProgramSource(
      payload.sourceCode,
      codestub.driverCode
    );
    const sourceFile = getSourceFile(language.extension);
    const totalTestcases = question.testcases.length;
    const existing = await prisma.userProgress.findUnique({
      where: {
        userId_questionId: {
          userId: payload.userId,
          questionId: payload.questionId,
        },
      },
      select: { status: true },
    });
    const wasCompleted = existing?.status === QuestionStatusType.completed;

    await prisma.userProgress.upsert({
      where: {
        userId_questionId: {
          userId: payload.userId,
          questionId: payload.questionId,
        },
      },
      create: {
        userId: payload.userId,
        questionId: payload.questionId,
        userCode: payload.sourceCode,
        languageId: payload.languageId,
        status: QuestionStatusType.attempted,
        result: ResultType.RUNNING,
        totalTestcases,
        errorLog: null,
      },
      update: {
        userCode: payload.sourceCode,
        languageId: payload.languageId,
        result: ResultType.RUNNING,
        totalTestcases,
        errorLog: null,
      },
    });

    if (!wasCompleted) {
      await prisma.userProgress.updateMany({
        where: {
          userId: payload.userId,
          questionId: payload.questionId,
          status: { not: QuestionStatusType.completed },
        },
        data: { status: QuestionStatusType.attempted },
      });
    }

    let outcome: SubmissionOutcome;
    if (
      question.judgeType === JudgeType.SPECIAL_JUDGE ||
      question.hasChecker
    ) {
      outcome = failureResult(
        "Special-judge execution is unavailable until a checker input/output contract is configured",
        totalTestcases
      );
    } else {
      try {
        outcome = await withSandbox(
          {
            image: language.dockerImage,
            memoryLimitMiB: question.memoryLimit,
            timeLimitMs: question.timeLimit,
            testcaseCount: totalTestcases,
            extension: language.extension,
          },
          async (session) => {
            await writeSource(session, sourceFile, source);
            if (language.compileCmd) {
              const compilation = await runCommand(
                session,
                language.compileCmd,
                "",
                60_000
              );
              if (compilation.exitCode !== 0) {
                return failureResult(
                  `Compilation failed:\n${compilation.stderr}`,
                  totalTestcases,
                  ResultType.COMPILE_ERROR
                );
              }
            }

            let testcasesPassed = 0;
            let timeTaken = 0;
            for (const [index, testcase] of question.testcases.entries()) {
              let execution;
              try {
                execution = await runCommand(
                  session,
                  language.runCmd,
                  testcase.input,
                  question.timeLimit
                );
              } catch (error) {
                if (error instanceof SandboxExecutionError) {
                  return {
                    ...failureResult(
                      error.message,
                      totalTestcases,
                      resultForSandboxError(error)
                    ),
                    testcasesPassed,
                    timeTaken: timeTaken + question.timeLimit,
                  };
                }
                throw error;
              }

              timeTaken += execution.durationMs;
              if (execution.exitCode !== 0) {
                return {
                  result: ResultType.RUNTIME_ERROR,
                  testcasesPassed,
                  totalTestcases,
                  timeTaken,
                  memoryUsed: 0,
                  errorLog: execution.stderr.slice(0, 16_000),
                };
              }
              if (
                !outputsMatch(
                  question.judgeType,
                  execution.stdout,
                  testcase.expectedOutput
                )
              ) {
                return {
                  result: ResultType.WRONG,
                  testcasesPassed,
                  totalTestcases,
                  timeTaken,
                  memoryUsed: 0,
                  errorLog: `Wrong answer on testcase ${index + 1}`,
                };
              }
              testcasesPassed += 1;
            }

            return {
              result: ResultType.SUCCESS,
              testcasesPassed,
              totalTestcases,
              timeTaken,
              memoryUsed: 0,
              errorLog: null,
            };
          }
        );
      } catch (error) {
        if (error instanceof SandboxExecutionError) {
          outcome = failureResult(
            error.message,
            totalTestcases,
            resultForSandboxError(error)
          );
        } else {
          console.error("[SUBMIT_CODE_SANDBOX]", error);
          outcome = failureResult(
            "Sandbox execution failed due to an infrastructure error.",
            totalTestcases
          );
        }
      }
    }

    const progressData = {
      userCode: payload.sourceCode,
      languageId: payload.languageId,
      result: outcome.result,
      timeTaken: outcome.timeTaken,
      memoryUsed: outcome.memoryUsed,
      testcasesPassed: outcome.testcasesPassed,
      totalTestcases: outcome.totalTestcases,
      errorLog: outcome.errorLog,
    };

    await prisma.$transaction(async (transaction) => {
      const updateResult = await transaction.userProgress.updateMany({
        where: {
          userId: payload.userId,
          questionId: payload.questionId,
          status: { not: QuestionStatusType.completed },
        },
        data: {
          ...progressData,
          status:
            outcome.result === ResultType.SUCCESS
              ? QuestionStatusType.completed
              : QuestionStatusType.attempted,
        },
      });

      if (updateResult.count === 0) {
        await transaction.userProgress.update({
          where: {
            userId_questionId: {
              userId: payload.userId,
              questionId: payload.questionId,
            },
          },
          data: progressData,
        });
      } else if (outcome.result === ResultType.SUCCESS && !wasCompleted) {
        await transaction.question.update({
          where: { id: payload.questionId },
          data: { noOfPeopleSolved: { increment: 1 } },
        });
      }

      await transaction.question.update({
        where: { id: payload.questionId },
        data: { noOfSubmissions: { increment: 1 } },
      });
    });

    return outcome;
  },
});
