import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/utils/roles";
import { AdminUserCard } from "@/components/Admin/RouteSide/AdminUserCard";
import PaginationControls from "@/components/Admin/RouteSide/PaginationControls";
import AdminPageHeader from "@/components/Admin/RouteSide/AdminPageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CatSeal, SectionHeading } from "@/components/User/Profileornaments";

export const metadata = { title: "User Management" };

type AdminUserRow = {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  beltRank: string | null;
  profileUrl: string | null;
  createdAt: Date;
  role: string;
};

const rowGrid = "md:grid-cols-[minmax(0,1fr)_8rem_8rem_auto]";

export default async function AdminUsersPage(props: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const user = await currentUser();
  if (!user || !checkRole("admin")) {
    redirect("/");
  }

  const params = await props.searchParams;
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);
  const limit = 10;
  const skip = (page - 1) * limit;

  const [users, totalCount] = await prisma.$transaction([
    prisma.user.findMany({
      where: {
        NOT: { id: user.id },
      },
      take: limit,
      skip: skip,
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        beltRank: true,
        profileUrl: true,
        createdAt: true,
        role: true,
      },
    }),
    prisma.user.count({ where: { NOT: { id: user.id } } }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  const admins = users.filter((u) => u.role === "admin");
  const moderators = users.filter((u) => u.role === "moderator");
  const disciples = users.filter((u) => u.role !== "admin" && u.role !== "moderator");

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <AdminPageHeader
        title="Disciples"
        kanji="門下"
        description="Everyone who trains in the dojo. Change roles here to give disciples moderation or admin access."
      >
        <p className="text-sm text-[#a1887f]">
          <span className="font-serif text-2xl tabular-nums text-[#eaddcf]">
            {totalCount.toLocaleString()}
          </span>{" "}
          {totalCount === 1 ? "other disciple" : "other disciples"}
          {totalPages > 1 && (
            <span className="ml-3 text-[#8d6e63]">
              Page {page} of {totalPages}
            </span>
          )}
        </p>
      </AdminPageHeader>

      {users.length === 0 ? (
        <div className="flex flex-col items-center border-y border-[#3e2723] px-4 py-20 text-center">
          <CatSeal className="size-12 text-[#5d4037]" />
          <h2 className="mt-6 font-serif text-xl text-[#eaddcf]">No disciples found</h2>
          <p className="mt-2 text-sm text-[#a1887f]">There is nobody else on this page.</p>
        </div>
      ) : (
        <div className="space-y-12">
          <div
            aria-hidden
            className={`hidden gap-x-6 px-2 text-xs text-[#8d6e63] md:grid ${rowGrid}`}
          >
            <span>Disciple</span>
            <span>Belt</span>
            <span>Joined</span>
            <span className="w-20" />
          </div>

          <MemberSection title="Admins" kanji="管理" members={admins} brush="admin" />
          <MemberSection title="Moderators" kanji="巡回" members={moderators} brush="moderator" />
          <MemberSection title="Disciples" kanji="門下" members={disciples} brush="disciple" />
        </div>
      )}

      {totalPages > 1 && <PaginationControls currentPage={page} totalPages={totalPages} />}
    </div>
  );
}

function MemberSection({
  title,
  kanji,
  members,
  brush,
}: {
  title: string;
  kanji: string;
  members: AdminUserRow[];
  brush: "admin" | "moderator" | "disciple";
}) {
  if (members.length === 0) return null;

  return (
    <section aria-label={title} className="-mt-6 first:mt-0">
      <div className="member-brush-row member-brush-heading" data-brush={brush}>
        <SectionHeading
          title={title}
          kanji={kanji}
          aside={<span className="text-sm tabular-nums text-[#8d6e63]">{members.length}</span>}
        />
      </div>
      <ul>
        {members.map((u) => {
          const rowBrush =
            u.role === "admin" ? "admin" : u.role === "moderator" ? "moderator" : "disciple";
          return <MemberRow key={u.id} u={u} brush={rowBrush} />;
        })}
      </ul>
    </section>
  );
}

function MemberRow({
  u,
  brush,
}: {
  u: AdminUserRow;
  brush: "admin" | "moderator" | "disciple";
}) {
  const displayName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.name || "Unknown";
  const belt = u.beltRank ? u.beltRank.toLowerCase().replace(/_/g, " ") : null;
  const joined = format(new Date(u.createdAt), "MMM d, yyyy");

  return (
    <li
      className={`member-brush-row grid items-center gap-x-6 gap-y-2 border-b border-[#3e2723]/60 px-2 py-4 grid-cols-[minmax(0,1fr)_auto] ${rowGrid}`}
      data-brush={brush}
    >
      <div className="flex min-w-0 items-center gap-4">
        <Avatar className="size-10 border border-[#3e2723]">
          <AvatarImage src={u.profileUrl || ""} alt="" />
          <AvatarFallback className="bg-[#3e2723] text-[#eaddcf]">
            {(u.firstName?.[0] || u.name?.[0] || "?").toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="member-row-copy min-w-0">
          {u.name ? (
            <Link
              href={`/member/${u.name}`}
              className="block truncate font-medium text-[#eaddcf] transition-colors hover:text-[#d4af37]"
            >
              {displayName}
            </Link>
          ) : (
            <span className="block truncate font-medium text-[#eaddcf]">{displayName}</span>
          )}
          <p className="truncate text-sm text-[#8d6e63]">{u.email}</p>
          {/* Small screens: belt and join date fold under the email */}
          <p className="mt-0.5 text-xs text-[#8d6e63] md:hidden">
            {belt && <span className="capitalize">{belt}</span>}
            {belt && <span className="mx-2">/</span>}
            Joined {joined}
          </p>
        </div>
      </div>

      <span className="member-row-copy hidden text-sm capitalize text-[#a1887f] md:block">
        {belt ?? "None"}
      </span>
      <span className="member-row-copy hidden text-sm tabular-nums text-[#a1887f] md:block">
        {joined}
      </span>

      <div className="flex justify-end">
        <AdminUserCard
          user={{
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            profileUrl: u.profileUrl,
            role: u.role || "user",
            createdAt: u.createdAt,
            name: u.name,
            beltRank: u.beltRank,
          }}
        />
      </div>
    </li>
  );
}
