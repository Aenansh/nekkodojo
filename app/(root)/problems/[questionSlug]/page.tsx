import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProblemWorkspace from "@/components/Problems/ProblemWorkspace";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ questionSlug: string }>;
}): Promise<Metadata> {
  const { questionSlug } = await params;
  const question = await prisma.question.findUnique({
    where: { slug: questionSlug },
    select: { title: true },
  });

  return { title: question?.title ?? "Practice Problem" };
}

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ questionSlug: string }>;
}) {
  const { questionSlug } = await params;
  const question = await prisma.question.findUnique({
    where: { slug: questionSlug },
    select: { id: true, slug: true },
  });

  if (!question) notFound();

  return (
    <ProblemWorkspace
      questionId={question.id}
      questionSlug={question.slug}
    />
  );
}
