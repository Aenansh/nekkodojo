"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import SudoAuthForm from "@/components/Admin/RouteSide/SudoAuthForm";
import { CatSeal } from "@/components/User/Profileornaments";

export default function AdminAuthPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const checkSudoSession = async () => {
      setIsChecking(true);
      setError(null);
      try {
        const response = await fetch("/api/users/admin/auth");
        if (!response.ok) throw new Error("Failed to check admin session.");

        const result: { isAuthenticated: boolean; redirectTo: string | null } =
          await response.json();
        if (cancelled) return;

        if (result.isAuthenticated && result.redirectTo) {
          router.replace(result.redirectTo);
        } else {
          setIsChecking(false);
        }
      } catch (error) {
        console.error("Failed to check admin session:", error);
        if (!cancelled) {
          setError("Unable to verify your sudo session. Please try again.");
          setIsChecking(false);
        }
      }
    };

    void checkSudoSession();
    return () => {
      cancelled = true;
    };
  }, [router, retryCount]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0b0a] text-[#a1887f]">
        <div role="status" aria-live="polite" className="flex items-center gap-3 text-sm">
          <Loader2 className="size-4 animate-spin text-[#d4af37]" aria-hidden />
          Checking your session…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#0f0b0a] px-6 text-center">
        <CatSeal className="size-10 text-[#5d4037]" />
        <p role="alert" className="max-w-sm text-sm leading-relaxed text-[#d4796b]">
          {error}
        </p>
        <button
          type="button"
          onClick={() => setRetryCount((count) => count + 1)}
          className="rounded-full border border-[#3e2723] px-5 py-2 text-sm text-[#eaddcf] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
        >
          Try again
        </button>
      </div>
    );
  }

  return <SudoAuthForm />;
}
