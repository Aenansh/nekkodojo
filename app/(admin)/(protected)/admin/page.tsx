import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { checkRole } from "@/utils/roles";
import StaffHome, { type StaffSection } from "@/components/Admin/RouteSide/StaffHome";

export const metadata = { title: "Administration" };

const sections: StaffSection[] = [
  {
    title: "Dashboard",
    kanji: "本部",
    description: "Key statistics and recent activity across the dojo.",
    href: "/admin/dashboard",
  },
  {
    title: "Members",
    kanji: "門下",
    description: "Manage users, change roles and remove bots.",
    href: "/admin/users",
  },
  {
    title: "Library",
    kanji: "書庫",
    description: "Moderate discussions and remove spam.",
    href: "/admin/content",
  },
  {
    title: "Comments",
    kanji: "発言",
    description: "Review comments and remove those that break the rules.",
    href: "/admin/comments",
  },
  {
    title: "Reports",
    kanji: "報告",
    description: "Review reported content and users, and decide the outcome.",
    href: "/admin/reports",
  },
  {
    title: "Katas",
    kanji: "型",
    description: "Create and manage the problems members practice on.",
    href: "/admin/questions",
  },
];

export default async function AdminWelcomePage() {
  const user = await currentUser();

  if (!user || !checkRole("admin")) {
    redirect("/");
  }

  return (
    <StaffHome
      kanji="管理"
      heading="Administration"
      intro="Manage members, content and reports for NekkoDojo. Choose a section to begin."
      signedInAs={user.firstName ?? user.username ?? undefined}
      navLabel="Administration sections"
      sections={sections}
    />
  );
}
