import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CreateQuestionPageClient from "@/components/Admin/Questions/CreateQuestionPageClient";
import { SleepingCat } from "@/components/Landing Page/DojoGraphics";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create Question" };

export default async function CreateQuestionPage() {
  const user = await currentUser();
  if (!user || user.publicMetadata.role !== "admin") {
    redirect("/");
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { name: true, slug: true },
  });

  const categoryOptions = categories.map((c) => ({
    label: c.name,
    value: c.slug,
  }));

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        href="/admin/questions"
        className="group mb-6 inline-flex items-center gap-2 text-sm text-[#8d6e63] transition-colors hover:text-[#d4af37]"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        Back to questions
      </Link>

      <header className="mb-10 flex items-end justify-between gap-6 border-b border-[#5c3d21] pb-7">
        <div>
          <span className="font-serif text-sm tracking-[0.5em] text-[#d4af37]/80">型</span>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-wide text-[#eaddcf] md:text-4xl">
            Add New <span className="text-[#d4af37]">Kata</span>
          </h1>
          <p className="mt-2 text-[#a1887f]">Create a new problem to add to the Dojo library.</p>
        </div>
        <SleepingCat className="hidden w-28 opacity-70 md:block" />
      </header>

      <CreateQuestionPageClient categoryOptions={categoryOptions} />
    </div>
  );
}
