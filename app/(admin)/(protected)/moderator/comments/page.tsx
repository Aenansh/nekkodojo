import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { checkRole } from "@/utils/roles";

import { AdminCommentItem } from "@/components/Admin/RouteSide/AdminCommentItem";
import PaginationControls from "@/components/Admin/RouteSide/PaginationControls";
import AdminPageHeader from "@/components/Admin/RouteSide/AdminPageHeader";
import { CatSeal } from "@/components/User/Profileornaments";

export const metadata = { title: "Comment Moderation" };

function dayLabel(date: Date) {
  const day = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (day.toDateString() === today.toDateString()) return "Today";
  if (day.toDateString() === yesterday.toDateString()) return "Yesterday";
  return day.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function AdminCommentsPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await currentUser();
  if (!user || (!checkRole("admin") && !checkRole("moderator"))) {
    redirect("/");
  }

  const params = await props.searchParams;
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);
  const limit = 20;
  const skip = (page - 1) * limit;

  const [comments, totalCount] = await prisma.$transaction([
    prisma.comment.findMany({
      take: limit,
      skip: skip,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { firstName: true, lastName: true, profileUrl: true },
        },
        discussion: {
          select: { id: true, title: true },
        },
      },
    }),
    prisma.comment.count(),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  const groups: { label: string; items: typeof comments }[] = [];
  for (const comment of comments) {
    const label = dayLabel(comment.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(comment);
    else groups.push({ label, items: [comment] });
  }

  return (
    <div className="space-y-10">
      <AdminPageHeader
        title="Comments"
        kanji="発言"
        description="Review comments from across the dojo, newest first, and remove any that break the rules."
      >
        <p className="text-sm text-[#a1887f]">
          <span className="font-serif text-2xl tabular-nums text-[#eaddcf]">
            {totalCount.toLocaleString()}
          </span>{" "}
          {totalCount === 1 ? "comment" : "comments"} in total
          {totalPages > 1 && (
            <span className="ml-3 text-[#8d6e63]">
              Page {page} of {totalPages}
            </span>
          )}
        </p>
      </AdminPageHeader>

      {groups.length > 0 ? (
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <div className="flex items-center gap-4">
                <h2 className="shrink-0 font-serif text-base text-[#eaddcf]">{group.label}</h2>
                <span aria-hidden className="h-px flex-1 bg-[#3e2723]" />
                <span className="shrink-0 text-sm tabular-nums text-[#8d6e63]">
                  {group.items.length}
                </span>
              </div>

              <div className="mt-2">
                {group.items.map((comment) => (
                  <AdminCommentItem key={comment.id} data={comment} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center border-y border-[#3e2723] px-4 py-20 text-center">
          <CatSeal className="size-12 text-[#5d4037]" />
          <h2 className="mt-6 font-serif text-xl text-[#eaddcf]">No comments yet</h2>
          <p className="mt-2 text-sm text-[#a1887f]">
            New comments will appear here as members post them.
          </p>
        </div>
      )}

      {totalPages > 1 && <PaginationControls currentPage={page} totalPages={totalPages} />}
    </div>
  );
}
