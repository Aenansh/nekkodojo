import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import QuestionsAdminClient from "@/components/Admin/Questions/QuestionsAdminClient";

export const metadata = { title: "Question Management" };

export default async function QuestionsAdminPage() {
  const user = await currentUser();
  if (!user || user.publicMetadata.role !== "admin") {
    redirect("/");
  }

  const categoriesData = await prisma.category.findMany({
    orderBy: { categoryOrder: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 max-w-7xl">
      <QuestionsAdminClient categories={categoriesData} />
    </div>
  );
}
