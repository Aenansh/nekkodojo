import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ActivityChart } from "@/components/Admin/Dashboard/ActivityCharts";
import AdminPageHeader from "@/components/Admin/RouteSide/AdminPageHeader";
import { FigureStrip, RecentList, Shortcuts } from "@/components/Admin/Dashboard/DashboardParts";
import { getWeeklyStats } from "@/lib/activity";

export const metadata = { title: "Moderator Dashboard" };

const nameOf = (first?: string | null) => first?.trim() || "A member";
const ago = (date: Date) => formatDistanceToNow(new Date(date), { addSuffix: true });

export default async function ModeratorDashboard() {
  const user = await currentUser();

  if (!user) redirect("/");
  const role = user.publicMetadata.role as string;
  if (role !== "admin" && role !== "moderator") {
    redirect("/");
  }

  const [pendingReports, totalScrolls, recentScrolls, recentComments, todaysScrolls, chartData] =
    await Promise.all([
      prisma.report?.count({ where: { status: "PENDING" } }) || 0,
      prisma.discussion.count(),

      prisma.discussion.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          createdAt: true,
          author: { select: { firstName: true } },
        },
      }),

      prisma.comment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          description: true,
          createdAt: true,
          author: { select: { firstName: true } },
        },
      }),

      prisma.discussion.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),

      getWeeklyStats(),
    ]);

  return (
    <div className="mx-auto max-w-7xl space-y-14">
      <AdminPageHeader
        title="Dashboard"
        kanji="巡回"
        description="What needs your attention: open reports, and the newest discussions and comments."
      />

      <FigureStrip
        figures={[
          {
            label: "Open reports",
            value: pendingReports,
            note: "Waiting for review",
            href: "/moderator/reports",
            emphasis: Number(pendingReports) > 0,
          },
          {
            label: "New discussions today",
            value: todaysScrolls,
            href: "/moderator/content",
          },
          { label: "Discussions in total", value: totalScrolls.toLocaleString() },
        ]}
      />

      <div className="grid gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <div className="space-y-14">
          <ActivityChart chartData={chartData ?? []} />

          <RecentList
            title="New discussions"
            kanji="書庫"
            href="/moderator/content"
            empty="No discussions yet."
            items={recentScrolls.map((s) => ({
              id: s.id,
              primary: s.title,
              secondary: `${nameOf(s.author.firstName)}, ${ago(s.createdAt)}`,
            }))}
          />
        </div>

        <div className="space-y-14">
          <RecentList
            title="Recent comments"
            kanji="発言"
            href="/moderator/comments"
            empty="No comments yet."
            items={recentComments.map((c) => ({
              id: c.id,
              primary: c.description,
              secondary: `${nameOf(c.author.firstName)}, ${ago(c.createdAt)}`,
            }))}
          />

          <Shortcuts
            items={[
              {
                title: "Reports",
                kanji: "報告",
                description: "Review reported content",
                href: "/moderator/reports",
              },
              {
                title: "Library",
                kanji: "書庫",
                description: "Browse the latest discussions",
                href: "/moderator/content",
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
