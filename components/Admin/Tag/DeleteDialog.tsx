"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  tag: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteTagDialog({ tag, open, onOpenChange, onSuccess }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!tag) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/discussions/tag/delete?tagId=${tag.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        if (res.status === 409) {
          toast.error("Cannot delete: This tag is currently used in discussions.");
          return;
        }
        throw new Error("Failed to delete");
      }

      toast.success("Tag deleted!");
      router.refresh();
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-[#3e2723] bg-[#1a110d] text-[#eaddcf]">
        <AlertDialogHeader>
          <div className="mb-1 flex size-11 items-center justify-center rounded-full border border-[#8f3b31]/40 bg-[#8f3b31]/10 text-[#d4796b]">
            <AlertTriangle className="size-5" aria-hidden />
          </div>
          <AlertDialogTitle className="font-serif text-xl text-[#eaddcf]">
            Remove {tag?.name}?
          </AlertDialogTitle>
          <AlertDialogDescription className="leading-relaxed text-[#a1887f]">
            This removes the tag from the rack for good. If discussions are still using it, the dojo
            will stop the deletion. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="border-[#3e2723] bg-transparent text-[#eaddcf] hover:bg-[#0f0b0a] hover:text-[#eaddcf]">
            Keep it
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className="bg-[#8f3b31] text-[#eaddcf] hover:bg-[#a6453a]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> Removing…
              </>
            ) : (
              "Remove tag"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}