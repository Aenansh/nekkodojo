"use client";

import { useState } from "react";
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
import { generateSlug } from "@/lib/actions/makeSlug";
import { Field, PrereqPicker, fieldClass } from "@/components/Admin/Questions/KataParts";

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  categoryOrder: number;
}

interface Props {
  allCategories: CategoryData[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCategoryDialog({ allCategories, open, onOpenChange }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [order, setOrder] = useState<number | "">("");
  const [prereqs, setPrereqs] = useState<string[]>([]);

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(generateSlug(val));
  };

  const togglePrereq = (catSlug: string) => {
    setPrereqs((prev) =>
      prev.includes(catSlug) ? prev.filter((s) => s !== catSlug) : [...prev, catSlug]
    );
  };

  const handleSubmit = async () => {
    if (!name || !slug || order === "") {
      toast.error("Please fill in the name, slug and order.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/questions/category/create", {
        method: "POST",
        body: JSON.stringify({
          name,
          slug,
          categoryOrder: Number(order),
          prerequisiteArray: prereqs,
        }),
      });

      if (!res.ok) {
        const errorData: unknown = await res.json().catch(() => null);
        throw new Error(
          typeof errorData === "string" && errorData ? errorData : "Failed to create category"
        );
      }

      toast.success("Category added to the path.");
      router.refresh();

      setName("");
      setSlug("");
      setOrder("");
      setPrereqs([]);
      onOpenChange(false);
    } catch (error: unknown) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-[#3e2723] bg-[#1a110d] text-[#eaddcf]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Add a category</DialogTitle>
          <DialogDescription className="text-[#a1887f]">
            Lay a new stone on the learning path.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="create-name">
              <Input
                id="create-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Graphs"
                className={fieldClass}
              />
            </Field>
            <Field label="Slug (filled in for you)" htmlFor="create-slug">
              <Input
                id="create-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="graphs"
                className={`${fieldClass} font-mono text-xs`}
              />
            </Field>
          </div>

          <Field
            label="Order"
            htmlFor="create-order"
            hint="Where this stone sits on the path. Lower numbers come first."
          >
            <Input
              id="create-order"
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="12"
              className={fieldClass}
            />
          </Field>

          <Field label="Opens after (prerequisites)">
            <PrereqPicker options={allCategories} selected={prereqs} onToggle={togglePrereq} />
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
            onClick={handleSubmit}
            disabled={isLoading}
            className="rounded-full bg-[#d4af37] px-5 text-[#0f0b0a] hover:bg-[#b5952f]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> Adding…
              </>
            ) : (
              "Add category"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
