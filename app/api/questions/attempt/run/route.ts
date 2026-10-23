import { currentUser } from "@clerk/nextjs/server";
import { tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";
import {
  parseAttemptPayload,
  validateQuestionAttempt,
} from "../queue-utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json("Unauthorized!", { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json("Invalid JSON body", { status: 400 });
    }

    const payload = parseAttemptPayload(body, true);
    if (typeof payload === "string") {
      return NextResponse.json(payload, { status: 400 });
    }

    const validationError = await validateQuestionAttempt(
      user.id,
      payload,
      false
    );
    if (validationError) return validationError;

    const handle = await tasks.trigger("run-code", {
      userId: user.id,
      questionId: payload.questionId,
      languageId: payload.languageId,
      sourceCode: payload.sourceCode,
      input: payload.input!,
    });

    return NextResponse.json(
      { runId: handle.id, status: "QUEUED" },
      { status: 202 }
    );
  } catch (error) {
    console.error("[QUESTION_ATTEMPT_RUN_POST]", error);
    return NextResponse.json(
      "Unable to queue code run",
      { status: 503 }
    );
  }
}
/**
 * /api/questions/attempt/run
 * @description
 * validates an authenticated user's code-run request and queues it for execution with the supplied input.
 */
