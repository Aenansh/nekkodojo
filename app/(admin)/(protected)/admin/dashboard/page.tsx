import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { checkRole } from "@/utils/roles";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { SearchUsers } from "@/components/Admin/Dashboard/SearchUsers";
import { UserRoleCard } from "@/components/Admin/Dashboard/UserRoleCard";
import { ActivityChart } from "@/components/Admin/Dashboard/ActivityCharts";
import AdminPageHeader from "@/components/Admin/RouteSide/AdminPageHeader";
import { FigureStrip, RecentList, Shortcuts } from "@/components/Admin/Dashboard/DashboardParts";
import { CatSeal, SectionHeading } from "@/components/User/Profileornaments";
import { getWeeklyStats } from "@/lib/activity";

export const metadata = { title: "Admin Dashboard" };

const nameOf = (first?: string | null, last?: string | null) =>
  `${first ?? ""} ${last ?? ""}`.trim() || "A member";

const ago = (date: Date) => formatDistanceToNow(new Date(date), { addSuffix: true });

export default async function AdminDashboard(params: {
  searchParams: Promise<{ search?: string }>;
}) {
  if (!checkRole("admin")) {
    redirect("/");
  }

  const query = (await params.searchParams).search;

  const client = await clerkClient();
  const [
    userCount,
    scrollCount,
    reportCount,
    todaysJoiners,
    recentUsers,
    recentComments,
    chartData,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.discussion.count(),
    prisma.report?.count({ where: { status: "PENDING" } }) || 0,
    prisma.user.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),

    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, firstName: true, lastName: true, createdAt: true },
    }),

    prisma.comment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        description: true,
        createdAt: true,
        author: { select: { firstName: true, lastName: true } },
      },
    }),

    getWeeklyStats(),
  ]);

  const searchedUsers = query ? (await client.users.getUserList({ query })).data : [];

  return (
    <div className="mx-auto max-w-7xl space-y-14">
      <AdminPageHeader
        title="Dashboard"
        kanji="本部"
        description="How the dojo is doing this week, and where to find and manage its members."
      />

      <FigureStrip
        figures={[
          { label: "Members", value: userCount.toLocaleString() },
          { label: "Discussions", value: scrollCount.toLocaleString() },
          {
            label: "Open reports",
            value: reportCount,
            note: "Waiting for review",
            href: "/admin/reports",
            emphasis: Number(reportCount) > 0,
          },
          { label: "Joined today", value: todaysJoiners },
        ]}
      />

      {/* --- FIND A MEMBER --- */}
      <section aria-labelledby="find-heading">
        <SectionHeading id="find-heading" title="Find a member" kanji="検索" />
        <div className="mt-6">
          <SearchUsers placeholder="Search by name or email" />
        </div>

        {query && (
          <div className="mt-8">
            <p className="text-sm text-[#a1887f]">
              <span className="font-serif text-2xl tabular-nums text-[#eaddcf]">
                {searchedUsers.length}
              </span>{" "}
              {searchedUsers.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
              <Link href="?" className="ml-3 text-[#d4af37] underline-offset-4 hover:underline">
                Clear search
              </Link>
            </p>

            {searchedUsers.length === 0 ? (
              <div className="mt-6 flex flex-col items-center border-y border-[#3e2723] px-4 py-16 text-center">
                <CatSeal className="size-12 text-[#5d4037]" />
                <h3 className="mt-6 font-serif text-xl text-[#eaddcf]">No members found</h3>
                <p className="mt-2 text-sm text-[#a1887f]">Try a different name or email.</p>
              </div>
            ) : (
              <div className="mt-4 border-t border-[#3e2723]">
                {searchedUsers.map((u) => {
                  const currentRole = (u.publicMetadata.role as string) || "user";
                  const email = u.emailAddresses.find(
                    (e) => e.id === u.primaryEmailAddressId
                  )?.emailAddress;
                  return (
                    <UserRoleCard
                      key={u.id}
                      user={{
                        id: u.id,
                        firstName: u.firstName,
                        lastName: u.lastName,
                        imageUrl: u.imageUrl,
                        email: email,
                        initialRole: currentRole,
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* --- OVERVIEW (hidden while a search is showing) --- */}
      {!query && (
        <div className="grid gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <div className="space-y-14">
            <ActivityChart chartData={chartData ?? []} />

            <RecentList
              title="New members"
              kanji="新入"
              href="/admin/users"
              empty="No members have joined yet."
              items={recentUsers.map((u) => ({
                id: u.id,
                primary: `${nameOf(u.firstName, u.lastName)} joined`,
                secondary: ago(u.createdAt),
              }))}
            />
          </div>

          <div className="space-y-14">
            <RecentList
              title="Recent comments"
              kanji="発言"
              href="/admin/comments"
              empty="No comments yet."
              items={recentComments.map((c) => ({
                id: c.id,
                primary: c.description,
                secondary: `${nameOf(c.author.firstName, c.author.lastName)}, ${ago(c.createdAt)}`,
              }))}
            />

            <Shortcuts
              items={[
                {
                  title: "Members",
                  kanji: "門下",
                  description: "Manage roles and accounts",
                  href: "/admin/users",
                },
                {
                  title: "Reports",
                  kanji: "報告",
                  description: "Review reported content",
                  href: "/admin/reports",
                },
                {
                  title: "Katas",
                  kanji: "型",
                  description: "Create and edit problems",
                  href: "/admin/questions",
                },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
