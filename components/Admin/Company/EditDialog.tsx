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
import { Checkbox } from "@/components/ui/checkbox";
import { LogoUploader } from "./LogoUploader";
import { Field, fieldClass } from "@/components/Admin/Questions/KataParts";

interface Props {
  company: CompanyData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditCompanyDialog({ company, open, onOpenChange, onSuccess }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  
  const [includeLogo, setIncludeLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoId, setLogoId] = useState<string | null>(null);

  useEffect(() => {
    if (company) {
      setName(company.name);
      setWebsiteUrl(company.websiteUrl || "");
      
      if (company.logo) {
        setIncludeLogo(true);
        setLogoUrl(company.logo);
        setLogoId(company.logoId);
      } else {
        setIncludeLogo(false);
        setLogoUrl(null);
        setLogoId(null);
      }
    }
  }, [company]);

  const handleCheckboxChange = (checked: boolean) => {
    setIncludeLogo(checked);
    if (!checked) {
      setLogoUrl(null);
      setLogoId(null);
    }
  };

  const handleUpdate = async () => {
    if (!company) return;
    
    if (includeLogo && !logoUrl) {
      toast.error("Please upload a logo or uncheck the 'Has Logo' option.");
      return;
    }

    setIsLoading(true);

    const finalLogoUrl = includeLogo ? logoUrl : null;
    const finalLogoId = includeLogo ? logoId : null;

    try {
      const res = await fetch(`/api/companies/update?companyId=${company.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name,
          websiteUrl,
          logo: finalLogoUrl,
          logoId: finalLogoId,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("Company updated successfully!");
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
          <DialogTitle className="font-serif text-2xl">Edit company</DialogTitle>
          <DialogDescription className="text-[#a1887f]">
            Refine this house&apos;s name, website, or crest.
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

          <Field label="Slug (read-only)" hint="The company address stays the same.">
            <div className="rounded-md border border-[#3e2723] bg-[#0f0b0a]/50 px-3 py-2 font-mono text-sm text-[#8d6e63]">
              {company?.slug}
            </div>
          </Field>

          <Field label="Website URL" htmlFor="edit-web">
            <Input
              id="edit-web"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              className={fieldClass}
            />
          </Field>

          <div className="flex items-center gap-3 rounded-md border border-[#3e2723] bg-[#0f0b0a]/30 p-3">
            <Checkbox 
              id="has-logo" 
              checked={includeLogo}
              onCheckedChange={(checked) => handleCheckboxChange(checked === true)}
              className="border-[#5d4037] data-[state=checked]:border-[#d4af37] data-[state=checked]:bg-[#d4af37] data-[state=checked]:text-[#0f0b0a]"
            />
            <label htmlFor="has-logo" className="cursor-pointer select-none text-sm text-[#eaddcf]">
              This company has a crest
            </label>
          </div>

          {includeLogo && (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <LogoUploader 
                currentLogoUrl={logoUrl}
                onUploadSuccess={(res) => {
                  setLogoUrl(res.url);
                  setLogoId(res.fileId);
                }}
                onRemove={() => {
                  setLogoUrl(null);
                  setLogoId(null);
                }}
              />
            </div>
          )}
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