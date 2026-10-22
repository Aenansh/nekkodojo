"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function DeleteProgress() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleReset() {
    try {
      setLoading(true);

      const res = await fetch("/api/progress/delete", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");

      toast.success("Progress reset");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Unable to reset progress");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      aria-labelledby="reset-heading"
      className="flex flex-col gap-6 border-t border-[#3e2723] pt-8 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <h2 id="reset-heading" className="font-serif text-lg text-[#eaddcf]">
          Reset progress
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#a1887f]">
          Permanently removes your solved problems, belt, stats and activity history. This
          can&apos;t be undone.
        </p>
      </div>

      <AlertDialog open={open} onOpenChange={(next) => !loading && setOpen(next)}>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="rounded-full border-[#8f3b31] bg-transparent px-5 text-[#d4796b] hover:bg-[#8f3b31] hover:text-[#eaddcf]"
          >
            Reset progress
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent className="border-[#3e2723] bg-[#1a110d] text-[#eaddcf]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl text-[#eaddcf]">
              Reset all progress?
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed text-[#a1887f]">
              This erases your solved problems, belt, charts and history. You won&apos;t be able to
              recover them.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={loading}
              className="border-[#3e2723] bg-transparent text-[#eaddcf] hover:bg-[#0f0b0a] hover:text-[#eaddcf]"
            >
              Keep my progress
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (!loading) handleReset();
              }}
              className="bg-[#8f3b31] text-[#eaddcf] hover:bg-[#a6453a]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  Resetting…
                </>
              ) : (
                "Reset progress"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
