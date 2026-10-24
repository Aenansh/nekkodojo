"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import AdminShell from "@/components/Admin/RouteSide/AdminShell";

const inputClass =
  "mt-2 w-full border-0 border-b border-[#3e2723] bg-transparent px-0 py-3 text-[#eaddcf] transition-colors placeholder:text-[#6d4c41] focus:border-[#d4af37] focus:outline-none focus-visible:border-b-2";

export default function UpdateSudoPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast.error("User not loaded");
      return;
    }
    const form = e.currentTarget;
    setLoading(true);
    const formData = new FormData(form);
    const payload = {
      oldPass: formData.get("currentPassword") as string,
      newPass: formData.get("newPassword") as string,
      confirmPass: formData.get("confirmPassword") as string,
    };

    try {
      const role = (user.publicMetadata.role as string) || "user";
      const res = await fetch(`/api/users/admin/update-auth?role=${role}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = typeof data === "string" ? data : data.message || "Failed to update";
        throw new Error(errorMessage);
      }
      toast.success(data.message || "Password updated");
      form.reset();
      setTimeout(() => router.push("/admin/dashboard"), 1500);
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell
      kanji="更新"
      caption="Update. Keep your sudo password private and change it regularly."
    >
      <h1 className="font-serif text-3xl tracking-tight text-[#eaddcf]">Update credentials</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#a1887f]">
        Change your sudo password. You will return to the dashboard once it is saved.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-8">
        <div>
          <label htmlFor="currentPassword" className="text-sm text-[#a1887f]">
            Current password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </div>

        <div className="border-t border-[#3e2723] pt-8">
          <label htmlFor="newPassword" className="text-sm text-[#a1887f]">
            New password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            aria-describedby="newPasswordHint"
            className={inputClass}
          />
          <p id="newPasswordHint" className="mt-2 text-xs text-[#8d6e63]">
            At least 6 characters.
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="text-sm text-[#a1887f]">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#d4af37] py-3 font-medium text-[#0f0b0a] transition-colors hover:bg-[#b5952f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#eaddcf] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            "Update password"
          )}
        </button>

        <p className="text-center">
          <Link
            href="/auth"
            className="text-sm text-[#8d6e63] underline-offset-4 transition-colors hover:text-[#d4af37] hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </form>
    </AdminShell>
  );
}
