"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
  category: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteCategoryDialog({ category, open, onOpenChange, onSuccess }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!category) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/questions/category/delete?categoryId=${category.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        if (res.status === 409) {
          toast.error("Can't delete this one: other categories or katas still depend on it.");
          return;
        }
        throw new Error("Failed to delete");
      }

      toast.success("Category removed from the path.");
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
          <AlertDialogTitle className="font-serif text-xl text-[#eaddcf]">
            Remove {category?.name}?
          </AlertDialogTitle>
          <AlertDialogDescription className="leading-relaxed text-[#a1887f]">
            This takes the stone off the path for good. If other categories or katas still depend on
            it, the dojo will tell you and nothing will be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
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
              "Remove category"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
