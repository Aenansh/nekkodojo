import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LanguageManagementClient from "@/components/Admin/Questions/LanguageManagementClient";
import { Grain, LanternGlow } from "@/components/Landing Page/DojoGraphics";

export const metadata = { title: "Language Management" };

export default async function LanguageManagementPage() {
  const user = await currentUser();
  if (!user || user.publicMetadata.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="relative overflow-hidden">
      <Grain variant="washi" strength={0.5} />
      <LanternGlow className="-right-40 -top-40 size-[640px]" />
      <div className="container relative mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <LanguageManagementClient />
      </div>
    </div>
  );
}
