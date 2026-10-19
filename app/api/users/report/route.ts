import { fetchItems, set } from "@/lib/actions/caching";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json("Unauthorized!", { status: 401 });

    const body = await request.json();
    const { reportedId, reason } = body;
    if (typeof reportedId !== "string" || !reportedId || !reportedId.trim()) {
      return NextResponse.json("No user reported!", { status: 400 });
    }
    if (typeof reason !== "string" || !reason || !reason.trim()) {
      return NextResponse.json("No reason provided!", { status: 400 });
    }
    if (user.id === reportedId) {
      return NextResponse.json({ message: "You cannot report yourself." }, { status: 400 });
    }

    const cacheKey = `report:r=${reportedId}:rp=${user.id}`;

    const alreadyReported = await fetchItems({
      key: cacheKey,
      expires: 30,
      fetcher: async () => {
        const report = await prisma.report.findFirst({
          where: {
            reporterId: user.id,
            reportedId: reportedId,
          },
          select: {
            id: true,
          },
        });
        if (!report) return null;
        return report.id;
      },
    });

    if (alreadyReported)
      return NextResponse.json({ message: "You already reported this user." }, { status: 409 });

    await set({
      key: cacheKey,
      expires: 60,
      fetcher: async () => {
        const report = await prisma.report.create({
          data: {
            reporterId: user.id,
            reportedId: reportedId,
            reason,
          },
        });
        return report.id;
      },
    });

    return NextResponse.json({ success: true, message: "Report submitted successfully." });
  } catch (error) {
    console.error("Report API Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
/**
 * /api/users/report
 * @description
 * serves a report action by an user, prevents self reprt and multiple reports by a user.
 */
