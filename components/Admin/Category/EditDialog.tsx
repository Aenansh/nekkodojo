"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, PrereqPicker, fieldClass } from "@/components/Admin/Questions/KataParts";

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  categoryOrder: number;
  prerequisiteArray: { slug: string }[];
}

interface Props {
  category: CategoryData | null;
  allCategories: CategoryData[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditCategoryDialog({
  category,
  allCategories,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [order, setOrder] = useState<number | "">(0);
  const [prereqs, setPrereqs] = useState<string[]>([]);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setOrder(category.categoryOrder);
      setPrereqs(category.prerequisiteArray.map((p) => p.slug));
    }
  }, [category]);

  const togglePrereq = (slug: string) => {
    setPrereqs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  };

  const handleUpdate = async () => {
    if (!category) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/questions/category/update?categoryId=${category.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name,
          categoryOrder: Number(order),
          prerequisiteArray: prereqs,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("Category updated.");
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-[#3e2723] bg-[#1a110d] text-[#eaddcf]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Edit category</DialogTitle>
          <DialogDescription className="text-[#a1887f]">
            Rename it, move it along the path, or change what it opens after.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <Field label="Name" htmlFor="edit-name">
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
          </Field>

          <Field label="Order" htmlFor="edit-order" hint="Lower numbers come first.">
            <Input
              id="edit-order"
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value === "" ? "" : Number(e.target.value))}
              className={fieldClass}
            />
          </Field>

          <Field label="Opens after (prerequisites)">
            <PrereqPicker
              options={allCategories.filter((c) => c.id !== category?.id)}
              selected={prereqs}
              onToggle={togglePrereq}
            />
          </Field>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-full text-[#a1887f] hover:bg-transparent hover:text-[#eaddcf]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isLoading}
            className="rounded-full bg-[#d4af37] px-5 text-[#0f0b0a] hover:bg-[#b5952f]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
