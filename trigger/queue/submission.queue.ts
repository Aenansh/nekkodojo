import { queue } from "@trigger.dev/sdk";

export type SubmissionJobData = {
  userId: string;
  questionId: string;
  languageId: string;
  sourceCode: string;
};

export const submissionQueue = queue({
  name: "code-submission",
});
