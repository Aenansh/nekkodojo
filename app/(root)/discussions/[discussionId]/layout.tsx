import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ discussionId: string }>;
}): Promise<Metadata> {
  const { discussionId } = await params;
  const discussion = await prisma.discussion.findUnique({
    where: { id: discussionId },
    select: { title: true },
  });

  return { title: discussion?.title ?? "Discussion" };
}

export default function DiscussionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
