"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AdminShell from "./AdminShell";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "moderator", label: "Moderator" },
] as const;

export default function SudoAuthForm() {
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/users/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, role }),
      });

      const responseData: unknown = await res.json();

      if (!res.ok) {
        const message =
          typeof responseData === "string"
            ? responseData
            : typeof responseData === "object" &&
                responseData !== null &&
                "message" in responseData &&
                typeof responseData.message === "string"
              ? responseData.message
              : "Authentication failed";
        throw new Error(message);
      }

      if (
        typeof responseData !== "object" ||
        responseData === null ||
        !("redirectTo" in responseData) ||
        typeof responseData.redirectTo !== "string"
      ) {
        throw new Error("Authentication succeeded without a redirect target.");
      }

      toast.success(`Verified. Signed in as ${role}.`);
      router.replace(responseData.redirectTo);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message || "Something went wrong.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !loading && password.length > 0 && role !== "user";

  return (
    <AdminShell kanji="関所" caption="Checkpoint. This area is for staff only.">
      <h1 className="font-serif text-3xl tracking-tight text-[#eaddcf]">Restricted area</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#a1887f]">
        Choose your role and enter your sudo password to continue.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-8">
        <fieldset>
          <legend className="text-sm text-[#a1887f]">Role</legend>
          <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-md border border-[#3e2723]">
            {ROLES.map((r, i) => (
              <label
                key={r.value}
                className={cn(
                  "cursor-pointer px-4 py-3 text-center text-sm transition-colors has-focus-visible:ring-2 has-focus-visible:ring-inset has-focus-visible:ring-[#eaddcf]",
                  i > 0 && "border-l border-[#3e2723]",
                  role === r.value
                    ? "bg-[#d4af37] font-medium text-[#0f0b0a]"
                    : "text-[#a1887f] hover:text-[#eaddcf]"
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={role === r.value}
                  onChange={() => setRole(r.value)}
                  className="sr-only"
                />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="sudo-password" className="text-sm text-[#a1887f]">
            Sudo password
          </label>
          <input
            id="sudo-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border-0 border-b border-[#3e2723] bg-transparent px-0 py-3 text-[#eaddcf] transition-colors focus:border-[#d4af37] focus:outline-none focus-visible:border-b-2"
          />
        </div>

        {error && (
          <p role="alert" className="border-l-2 border-[#8f3b31] pl-3 text-sm text-[#d4796b]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#d4af37] py-3 font-medium text-[#0f0b0a] transition-colors hover:bg-[#b5952f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#eaddcf] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Verifying…
            </>
          ) : (
            "Verify and continue"
          )}
        </button>
      </form>
    </AdminShell>
  );
}
