import { currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import QuestionEditor from "@/components/Admin/Questions/QuestionEditor";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Question Editor" };

export default async function QuestionEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await currentUser();
  if (!user || user.publicMetadata.role !== "admin") redirect("/");

  const [{ slug }, categories, companies] = await Promise.all([
    params,
    prisma.category.findMany({
      orderBy: { categoryOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.company.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const question = await prisma.question.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!question) notFound();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <QuestionEditor
        questionId={question.id}
        categories={categories}
        companies={companies}
      />
    </div>
  );
}
