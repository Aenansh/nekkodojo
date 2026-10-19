import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json("Unauthorized!", { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        userProgresses: {
          select: {
            questionId: true,
            status: true,
          },
        },
      },
    });

    if (!userData) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(userData.userProgresses, { status: 200 });
  } catch (error) {
    console.error("[GET_USER_PROGRESS]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
/**
 * /api/progress
 * @description
 * fetches a user's progress (current user).
 */

export async function DELETE() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json("Unauthorized", { status: 401 });

    await prisma.$transaction([
      prisma.userProgress.deleteMany({
        where: {
          userId: user.id,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { noOfQuestionsSolved: 0 },
      }),
    ]);

    return NextResponse.json("Progress deleted!", { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json("Internal Server Error.", { status: 500 });
  }
}
/**
 * /api/progress
 * @description
 * deletes a user's progress (current user).
 */