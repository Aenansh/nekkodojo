import { task } from "@trigger.dev/sdk";
import { ResultType } from "../generated/prisma/client";
import {
  buildProgramSource,
  getSourceFile,
  loadExecutionBundle,
  validateRunInput,
} from "./execution-utils";
import {
  SandboxExecutionError,
  runCommand,
  withSandbox,
  writeSource,
} from "./kubernetes-sandbox";
import { runQueue, type RunJobData } from "./queue/run.queue";

export const runCodeTask = task({
  id: "run-code",
  queue: runQueue,
  retry: { maxAttempts: 1 },
  run: async (payload: RunJobData) => {
    if (
      !payload ||
      typeof payload.userId !== "string" ||
      typeof payload.questionId !== "string" ||
      typeof payload.languageId !== "string" ||
      typeof payload.sourceCode !== "string" ||
      typeof payload.input !== "string"
    ) {
      throw new Error("Run job payload is invalid");
    }
    validateRunInput(payload.input);

    const { question, language, codestub } = await loadExecutionBundle(
      payload.questionId,
      payload.languageId,
      { requireTestcases: false }
    );
    const source = buildProgramSource(payload.sourceCode, codestub.driverCode);
    const sourceFile = getSourceFile(language.extension);

    try {
      return await withSandbox(
        {
          image: language.dockerImage,
          memoryLimitMiB: question.memoryLimit,
          timeLimitMs: question.timeLimit,
          testcaseCount: 1,
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
              return {
                result: ResultType.COMPILE_ERROR,
                stdout: "",
                stderr: compilation.stderr.slice(0, 16_000),
                timeTaken: compilation.durationMs,
              };
            }
          }

          const execution = await runCommand(
            session,
            language.runCmd,
            payload.input,
            question.timeLimit
          );
          if (execution.exitCode !== 0) {
            return {
              result: ResultType.RUNTIME_ERROR,
              stdout: execution.stdout,
              stderr: execution.stderr.slice(0, 16_000),
              timeTaken: execution.durationMs,
            };
          }
          return {
            result: ResultType.SUCCESS,
            stdout: execution.stdout,
            stderr: execution.stderr.slice(0, 16_000),
            timeTaken: execution.durationMs,
          };
        }
      );
    } catch (error) {
      if (error instanceof SandboxExecutionError) {
        return {
          result:
            error.reason === "TIME_LIMIT_EXCEEDED"
              ? ResultType.TIME_LIMIT_EXCEEDED
              : error.reason === "OUTPUT_LIMIT_EXCEEDED"
                ? ResultType.RUNTIME_ERROR
                : ResultType.SYSTEM_ERROR,
          stdout: "",
          stderr: error.message,
          timeTaken: question.timeLimit,
        };
      }
      throw error;
    }
  },
});
