import { notFound } from "next/navigation";
import ProblemWorkspace from "@/components/Problems/ProblemWorkspace";
import { prisma } from "@/lib/prisma";

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ questionSlug: string }>;
}) {
  const { questionSlug } = await params;
  console.log(questionSlug)
  const question = await prisma.question.findUnique({
    where: { slug: questionSlug },
    select: { id: true, slug: true },
  });

  console.log(question);

  if (!question) notFound();

  return (
    <ProblemWorkspace
      questionId={question.id}
      questionSlug={question.slug}
    />
  );
}
