import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import StaffHome, { type StaffSection } from "@/components/Admin/RouteSide/StaffHome";

export const metadata = { title: "Moderation" };

const sections: StaffSection[] = [
  {
    title: "Dashboard",
    kanji: "本部",
    description: "Open reports and content statistics at a glance.",
    href: "/moderator/dashboard",
  },
  {
    title: "Library",
    kanji: "書庫",
    description: "Review new discussions and posts as they appear.",
    href: "/moderator/content",
  },
  {
    title: "Comments",
    kanji: "発言",
    description: "Review comments and remove those that break the rules.",
    href: "/moderator/comments",
  },
  {
    title: "Reports",
    kanji: "報告",
    description: "Review reported content and decide the outcome.",
    href: "/moderator/reports",
  },
];

export default async function ModeratorWelcomePage() {
  const user = await currentUser();
  const role = user?.publicMetadata.role as string;
  if (!user || (role !== "admin" && role !== "moderator")) {
    redirect("/");
  }

  return (
    <StaffHome
      kanji="巡回"
      heading="Moderation"
      intro="Keep the community orderly. Review new content, comments and reports from here."
      signedInAs={user.firstName ?? user.username ?? undefined}
      navLabel="Moderation sections"
      sections={sections}
    />
  );
}
