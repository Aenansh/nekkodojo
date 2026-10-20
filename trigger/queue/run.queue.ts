import { queue } from "@trigger.dev/sdk";

export type RunJobData = {
  userId: string;
  questionId: string;
  languageId: string;
  sourceCode: string;
  input: string;
};

export const runQueue = queue({
  name: "code-run",
});
