import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findFirst({
    where: { name: username },
    select: { name: true },
  });

  return { title: user?.name ?? username };
}

export default function MemberProfileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
