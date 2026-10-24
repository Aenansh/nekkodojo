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
import { Field, fieldClass } from "@/components/Admin/Questions/KataParts";

interface Props {
  tag: TagData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditTagDialog({ tag, open, onOpenChange, onSuccess }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");                                                         
  const [color, setColor] = useState("");

  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setSlug(tag.slug);
      setColor(tag.color!);
    }
  }, [tag]);

  const handleUpdate = async () => {
    if (!tag) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/discussions/tag/update?tagId=${tag.id}`, {
        method: "PUT",
        body: JSON.stringify({ name, slug, color }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("Tag updated!");
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
          <DialogTitle className="font-serif text-2xl">Edit tag</DialogTitle>
          <DialogDescription className="text-[#a1887f]">
            Refine this tag&apos;s name or color.
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
          <Field
            label="Color classes"
            htmlFor="edit-color"
            hint="Enter Tailwind classes, such as bg-red-500 text-white."
          >
            <div className="flex items-center gap-3">
              <Input
                id="edit-color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
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
