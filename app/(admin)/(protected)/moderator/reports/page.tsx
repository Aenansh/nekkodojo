import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { checkRole } from "@/utils/roles";
import { ReportCard } from "@/components/Admin/RouteSide/ReportCard";
import { UserReportCard } from "@/components/Admin/RouteSide/UserReportCard";
import { BannedUserCard } from "@/components/Admin/RouteSide/BannedUserCard";
import { Tag } from "@/components/Admin/RouteSide/ReportParts";
import AdminPageHeader from "@/components/Admin/RouteSide/AdminPageHeader";
import { CatSeal } from "@/components/User/Profileornaments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = { title: "Moderation Reports" };

/**
 * One page for both roles: re-export it from /admin/reports and
 * /moderator/reports (`export { default, metadata } from "..."`).
 */
export default async function AdminReportsPage() {
  const user = await currentUser();
  if (!user || (!checkRole("admin") && !checkRole("moderator"))) redirect("/");

  const userReports = await prisma.report.findMany({
    where: { status: "PENDING", reportedId: { not: null } },
    include: {
      reporter: { select: { firstName: true, lastName: true, profileUrl: true } },
      reported: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileUrl: true,
          email: true,
          isBanned: true,
          isShadowBanned: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const discussionReports = await prisma.report.findMany({
    where: { status: "PENDING", discussionId: { not: null } },
    include: {
      reporter: { select: { firstName: true, lastName: true, profileUrl: true } },
      discussion: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const commentReports = await prisma.report.findMany({
    where: { status: "PENDING", commentId: { not: null } },
    include: {
      reporter: { select: { firstName: true, lastName: true, profileUrl: true } },
      comment: { select: { id: true, description: true, discussionId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const bannedUsers = await prisma.user.findMany({
    where: { isBanned: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profileUrl: true,
      email: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const oneDayAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
  const resolvedReports = await prisma.report.findMany({
    where: { status: { not: "PENDING" }, createdAt: { gte: oneDayAgo } },
    include: {
      reporter: { select: { firstName: true, lastName: true, profileUrl: true } },
      discussion: { select: { id: true, title: true } },
      comment: { select: { id: true, description: true, discussionId: true } },
      reported: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileUrl: true,
          email: true,
          isBanned: true,
          isShadowBanned: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const totalCases = discussionReports.length + commentReports.length + userReports.length;

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <AdminPageHeader
        title="Reports"
        kanji="報告"
        description="Cases raised by members. Review each one, then dismiss it or take action."
      >
        <div className="space-y-4">
          <p className="text-sm text-[#a1887f]">
            <span className="font-serif text-2xl tabular-nums text-[#eaddcf]">{totalCases}</span>{" "}
            open {totalCases === 1 ? "case" : "cases"}
          </p>
          {/* Colour key for decisions */}
          <ul className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Colour key">
            <li>
              <Tag tone="clear">Dismiss or lift</Tag>
            </li>
            <li>
              <Tag tone="shadow">Shadow ban</Tag>
            </li>
            <li>
              <Tag tone="ban">Ban or delete</Tag>
            </li>
          </ul>
        </div>
      </AdminPageHeader>

      <Tabs defaultValue="members" className="w-full gap-0">
        <div className="overflow-x-auto scrollbar-hide">
          <TabsList className="h-auto w-max min-w-full justify-start gap-8 rounded-none border-b border-[#3e2723] bg-transparent p-0">
            <TabButton value="members" label="Members" count={userReports.length} tone="open" />
            <TabButton
              value="discussions"
              label="Discussions"
              count={discussionReports.length}
              tone="open"
            />
            <TabButton
              value="comments"
              label="Comments"
              count={commentReports.length}
              tone="open"
            />
            <TabButton value="banned" label="Banned" count={bannedUsers.length} tone="ban" />
            <TabButton value="resolved" label="Resolved" />
          </TabsList>
        </div>

        <TabsContent value="members" className="mt-0">
          {userReports.length > 0 ? (
            <div>
              {userReports.map(
                (r) =>
                  r.reported && (
                    <UserReportCard key={r.id} report={{ ...r, reported: r.reported }} />
                  )
              )}
            </div>
          ) : (
            <EmptyState message="No members have been reported." />
          )}
        </TabsContent>

        <TabsContent value="discussions" className="mt-0">
          {discussionReports.length > 0 ? (
            <div>
              {discussionReports.map((r) => (
                <ReportCard key={r.id} report={r} />
              ))}
            </div>
          ) : (
            <EmptyState message="No discussions have been reported." />
          )}
        </TabsContent>

        <TabsContent value="comments" className="mt-0">
          {commentReports.length > 0 ? (
            <div>
              {commentReports.map((r) => (
                <ReportCard key={r.id} report={r} />
              ))}
            </div>
          ) : (
            <EmptyState message="No comments have been reported." />
          )}
        </TabsContent>

        <TabsContent value="banned" className="mt-0">
          <p className="py-4 text-sm text-[#8d6e63]">
            Members who are currently banned. Lifting a ban restores their access.
          </p>
          {bannedUsers.length > 0 ? (
            <div className="border-t border-[#3e2723]">
              {bannedUsers.map((u) => (
                <BannedUserCard key={u.id} user={u} />
              ))}
            </div>
          ) : (
            <EmptyState message="Nobody is currently banned." />
          )}
        </TabsContent>

        <TabsContent value="resolved" className="mt-0">
          <p className="py-4 text-sm text-[#8d6e63]">Cases closed in the last 24 hours.</p>
          {resolvedReports.length > 0 ? (
            <div className="border-t border-[#3e2723]">
              {resolvedReports.map((r) =>
                r.reportedId && r.reported ? (
                  <UserReportCard key={r.id} report={{ ...r, reported: r.reported }} />
                ) : (
                  <ReportCard key={r.id} report={r} />
                )
              )}
            </div>
          ) : (
            <EmptyState message="Nothing has been resolved in the last 24 hours." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TabButton({
  value,
  label,
  count,
  tone,
}: {
  value: string;
  label: string;
  count?: number;
  tone?: "open" | "ban";
}) {
  return (
    <TabsTrigger
      value={value}
      className="-mb-px h-auto flex-none gap-2 rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-3 pt-2 text-[#8d6e63] shadow-none transition-colors hover:text-[#eaddcf] data-[state=active]:border-[#d4af37] data-[state=active]:bg-transparent data-[state=active]:text-[#eaddcf] data-[state=active]:shadow-none dark:data-[state=active]:border-[#d4af37] dark:data-[state=active]:bg-transparent"
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={`text-xs tabular-nums ${tone === "ban" ? "text-[#d4796b]" : "text-[#d4af37]"}`}
        >
          {count}
        </span>
      )}
    </TabsTrigger>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center border-b border-[#3e2723] px-4 py-20 text-center">
      <CatSeal className="size-12 text-[#5d4037]" />
      <p className="mt-6 text-sm text-[#a1887f]">{message}</p>
    </div>
  );
}
