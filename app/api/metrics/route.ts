import { NextResponse } from "next/server";
import { BeltType, QuestionStatusType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { Belt, MetricsResponse } from "@/types/metrics";

export const dynamic = "force-dynamic";

const BELT_LABELS: Record<BeltType, Belt> = {
  [BeltType.white_belt]: "White",
  [BeltType.yellow_belt]: "Yellow",
  [BeltType.orange_belt]: "Orange",
  [BeltType.green_belt]: "Green",
  [BeltType.blue_belt]: "Blue",
  [BeltType.purple_belt]: "Purple",
  [BeltType.brown_belt]: "Brown",
  [BeltType.black_belt]: "Black",
};

export async function GET() {
  try {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setUTCHours(0, 0, 0, 0);
    const activeSince = new Date(now.getTime() - 15 * 60 * 1000);

    const [problemsPracticedToday, activeUsers, katasCompleted, hourlyActivity, topSensei] =
      await Promise.all([
        prisma.userProgress.count({
          where: { updatedAt: { gte: dayStart } },
        }),
        prisma.$queryRaw<{ count: number }[]>`
          SELECT COUNT(DISTINCT "userId")::int AS count
          FROM "UserProgress"
          WHERE "updatedAt" >= ${activeSince}
        `,
        prisma.userProgress.count({
          where: { status: QuestionStatusType.completed },
        }),
        prisma.$queryRaw<{ hour: number; count: number }[]>`
          SELECT
            EXTRACT(HOUR FROM "updatedAt" AT TIME ZONE 'UTC')::int AS hour,
            COUNT(*)::int AS count
          FROM "UserProgress"
          WHERE "updatedAt" >= ${dayStart}
          GROUP BY hour
        `,
        prisma.$queryRaw<{ name: string | null; beltRank: BeltType; solved: number }[]>`
          SELECT
            u."name",
            u."beltRank",
            COUNT(*)::int AS solved
          FROM "UserProgress" AS p
          INNER JOIN "User" AS u ON u."id" = p."userId"
          WHERE p."status" = 'completed'
            AND u."isBanned" = false
            AND (u."isOnboarded" = true OR u."noOfQuestionsSolved" > 0)
          GROUP BY u."id"
          ORDER BY COUNT(*) DESC, COALESCE(u."noOfQuestionsSolved", 0) DESC, u."createdAt" ASC
          LIMIT 5
        `,
      ]);

    const hourly = Array.from({ length: 24 }, () => 0);
    for (const activity of hourlyActivity) {
      hourly[activity.hour] = activity.count;
    }

    const response: MetricsResponse = {
      stats: {
        problemsPracticedToday,
        activeNow: activeUsers[0].count,
        katasCompleted,
        hourly,
      },
      sensei: topSensei.map((member) => ({
        name: member.name || "Ninja",
        belt: BELT_LABELS[member.beltRank],
        solved: member.solved,
      })),
    };

    return NextResponse.json(response, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("[METRICS_GET]", error);
    return NextResponse.json({ error: "Unable to load dojo metrics" }, { status: 500 });
  }
}
/**
 * /api/metrics
 * @description
 * fetches daily practice activity, recently active users, total completed katas, and the top five sensei.
 */
