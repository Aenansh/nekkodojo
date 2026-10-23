import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LanguageManagementClient from "@/components/Admin/Questions/LanguageManagementClient";

export const metadata = { title: "Language Management" };

export default async function LanguageManagementPage() {
  const user = await currentUser();
  if (!user || user.publicMetadata.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <LanguageManagementClient />
    </div>
  );
}
