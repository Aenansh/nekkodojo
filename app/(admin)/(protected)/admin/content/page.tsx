import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { checkRole } from "@/utils/roles";
import { AdminContentItem } from "@/components/Admin/RouteSide/AdminContentItem";
import PaginationControls from "@/components/Admin/RouteSide/PaginationControls";
import AdminPageHeader from "@/components/Admin/RouteSide/AdminPageHeader";
import { SearchUsers } from "@/components/Admin/Dashboard/SearchUsers";
import { CatSeal } from "@/components/User/Profileornaments";

export const metadata = { title: "Content Moderation" };

export default async function AdminContentPage(props: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const user = await currentUser();

  if (!user || !checkRole("admin")) {
    redirect("/");
  }

  const params = await props.searchParams;
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);
  const search = params.search || "";
  const limit = 10;
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [discussions, totalCount] = await prisma.$transaction([
    prisma.discussion.findMany({
      where,
      take: limit,
      skip: skip,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            profileUrl: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    }),
    prisma.discussion.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-10">
      <AdminPageHeader
        title="Library"
        kanji="書庫"
        description="Review the discussions members have posted, newest first, and remove any that don't belong."
      >
        <div className="space-y-5">
          <p className="text-sm text-[#a1887f]">
            <span className="font-serif text-2xl tabular-nums text-[#eaddcf]">
              {totalCount.toLocaleString()}
            </span>{" "}
            {search
              ? `${totalCount === 1 ? "result" : "results"} for \u201C${search}\u201D`
              : totalCount === 1
                ? "discussion in total"
                : "discussions in total"}
            {search && (
              <Link href="?" className="ml-3 text-[#d4af37] underline-offset-4 hover:underline">
                Clear search
              </Link>
            )}
          </p>

          <SearchUsers placeholder="Search discussions" />
        </div>
      </AdminPageHeader>

      {discussions.length > 0 ? (
        <div className="border-t border-[#3e2723]">
          {discussions.map((item) => (
            <AdminContentItem key={item.id} data={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center border-y border-[#3e2723] px-4 py-20 text-center">
          <CatSeal className="size-12 text-[#5d4037]" />
          <h2 className="mt-6 font-serif text-xl text-[#eaddcf]">No discussions found</h2>
          <p className="mt-2 text-sm text-[#a1887f]">
            {search
              ? `Nothing matches \u201C${search}\u201D.`
              : "No discussions have been posted yet."}
          </p>
        </div>
      )}

      {totalPages > 1 && <PaginationControls currentPage={page} totalPages={totalPages} />}
    </div>
  );
}
