import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;
    if (!user || !email) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        bio: true,
        profileUrl: true,
      },
    });

    return NextResponse.json(userData, { status: 200 });
  } catch (error) {
    console.error("GET ONBOARDING USER ERROR:", error);
    return NextResponse.json("Failed to fetch onboarding profile", { status: 500 });
  }
}
/**
 * /api/onboarding
 * @description
 * fetches user while onboarding.
 */