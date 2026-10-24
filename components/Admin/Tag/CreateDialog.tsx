"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import slugify from "slugify";
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
import { Field, fieldClass } from "@/components/Admin/Questions/KataParts";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateTagDialog({ open, onOpenChange, onSuccess }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("");

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = slugify(val, { lower: true, strict: true });
    setSlug(autoSlug);
  };

  const handleSubmit = async () => {
    if (!name || !slug || !color) {
      toast.error("Please fill in Name, Slug, and Color.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/discussions/tag/create", {
        method: "POST",
        body: JSON.stringify({ name, slug, color }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData || "Failed to create tag");
      }

      toast.success("Tag created successfully!");
      router.refresh();
      onSuccess?.();
      
      setName("");
      setSlug("");
      setColor("");
      onOpenChange(false);

    } catch (error) {
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
          <DialogTitle className="font-serif text-2xl">Add a tag</DialogTitle>
          <DialogDescription className="text-[#a1887f]">
            Add a new mark to help organize community discussions.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="create-name">
              <Input
                id="create-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="System Design"
                className={fieldClass}
              />
            </Field>
            <Field label="Slug (filled in for you)" htmlFor="create-slug">
              <Input
                id="create-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="system-design"
                className={`${fieldClass} font-mono text-xs`}
              />
            </Field>
          </div>

          <Field
            label="Color classes"
            htmlFor="create-color"
            hint="Enter Tailwind classes, such as bg-red-500 text-white."
          >
            <div className="flex items-center gap-3">
              <Input
                id="create-color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. bg-blue-500 text-white"
                className={fieldClass}
              />
              <div
                aria-label="Tag color preview"
                className={`flex size-10 shrink-0 items-center justify-center rounded-md border border-[#3e2723] text-xs ${color}`}
              >
                T
              </div>
            </div>
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
              "Add tag"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}