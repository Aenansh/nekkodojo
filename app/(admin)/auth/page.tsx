"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import SudoAuthForm from "@/components/Admin/RouteSide/SudoAuthForm";

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
      <div className="min-h-screen flex items-center justify-center text-[#d4af37]">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center">
        <p role="alert" className="text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => setRetryCount((count) => count + 1)}
          className="rounded-md border border-[#5d4037] px-4 py-2 text-[#eaddcf] hover:bg-[#1a110d]"
        >
          Try again
        </button>
      </div>
    );
  }

  return <SudoAuthForm />;
}
