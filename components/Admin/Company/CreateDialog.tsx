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
import { LogoUploader } from "./LogoUploader";
import attFromKit from "@/lib/actions/removeAtt";
import { Field, fieldClass } from "@/components/Admin/Questions/KataParts";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateCompanyDialog({ open, onOpenChange, onSuccess }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoId, setLogoId] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(slugify(val, { lower: true, strict: true }));
  };

  const handleSubmit = async () => {
    if (!name || !slug) {
      toast.error("Name and Slug are required.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/companies/create", {
        method: "POST",
        body: JSON.stringify({
          name,
          slug,
          websiteUrl,
          logo: logoUrl,
          logoId: logoId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData || "Failed to create company");
      }

      toast.success("Company created successfully!");
      router.refresh();
      onSuccess?.();

      setName("");
      setSlug("");
      setWebsiteUrl("");
      setLogoUrl(null);
      setLogoId(null);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to create company");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-[#3e2723] bg-[#1a110d] text-[#eaddcf]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Add a company</DialogTitle>
          <DialogDescription className="text-[#a1887f]">
            Hang a new crest on the wall for interview katas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="create-name">
              <Input
                id="create-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Acme"
                className={fieldClass}
              />
            </Field>
            <Field label="Slug (filled in for you)" htmlFor="create-slug">
              <Input
                id="create-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acme"
                className={`${fieldClass} font-mono text-xs`}
              />
            </Field>
          </div>

          <Field
            label="Website URL"
            htmlFor="create-web"
            hint="Optional. Use the company's public website."
          >
            <Input
              id="create-web"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              className={fieldClass}
            />
          </Field>

          <Field label="Company crest">
            <LogoUploader
              currentLogoUrl={logoUrl}
              onUploadSuccess={(res) => {
                setLogoUrl(res.url);
                setLogoId(res.fileId);
              }}
              onRemove={() => {
                setLogoUrl(null);
                setLogoId(null);
                attFromKit(logoId!);
              }}
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
            onClick={handleSubmit}
            disabled={isLoading}
            className="rounded-full bg-[#d4af37] px-5 text-[#0f0b0a] hover:bg-[#b5952f]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> Adding…
              </>
            ) : (
              "Add company"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
