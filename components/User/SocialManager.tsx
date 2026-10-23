"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Check,
  X,
  Pencil,
  Trash2,
  Link as LinkIcon,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getPlatform } from "@/lib/get-social";
import Image from "next/image";
import { toast } from "sonner";
import { CatSeal, SectionHeading } from "./Profileornaments";

interface SocialLink {
  id: string;
  platform: string;
  platformUrl: string;
}

interface Props {
  initialLinks?: SocialLink[];
  isOwnProfile?: boolean;
}

const panelClass =
  "w-full overflow-hidden rounded-lg border border-[#3e2723] bg-[#120c0a]/70 shadow-[inset_0_1px_0_rgba(234,221,207,0.03)]";

export default function SocialsManager({
  initialLinks,                                                                                            
  isOwnProfile = false,
}: Props) {
  const router = useRouter();

  const safeLinks = initialLinks || [];

  const [links, setLinks] = useState<SocialLink[]>(safeLinks);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  const fetchSocials = useCallback(async () => {
    if (!isOwnProfile) return;

    try {
      const res = await fetch("/api/users/socials");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: SocialLink[] = await res.json();
      setLinks(data);
    } catch (error) {
      console.error("Failed to sync social links", error);
    }
  }, [isOwnProfile]);

  useEffect(() => {
    if (initialLinks) {
      setLinks(initialLinks);
    }
  }, [initialLinks]);

  useEffect(() => {
    if (isOwnProfile) {
      fetchSocials();
    }
  }, [isOwnProfile, fetchSocials]);


  const handleCreate = async (url: string) => {
    if (!url.trim()) return setIsAdding(false);

    const info = getPlatform(url);
    const platformName = info?.type || "website";

    setIsLoading(true);
    try {
      const res = await fetch("/api/users/socials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: platformName,
          platformUrl: url,
        }),
      });

      if (!res.ok) throw new Error("Failed to add link");

      toast.success("Connection added");
      setIsAdding(false);

      await fetchSocials();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Could not add link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (index: number, newUrl: string) => {
    const linkToUpdate = links[index];

    if (!newUrl.trim()) {
      return handleDelete(index);
    }

    const info = getPlatform(newUrl);
    const platformName = info?.type || "website";

    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/socials?id=${linkToUpdate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: platformName,
          platformUrl: newUrl,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("Connection updated");
      setEditingIndex(null);

      await fetchSocials();
      router.refresh();
    } catch (error) {
      console.log(error);
      toast.error("Update failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (index: number) => {
    const linkToDelete = links[index];
    const previousLinks = [...links];

    setLinks(links.filter((_, i) => i !== index));
    setEditingIndex(null);

    try {
      const res = await fetch(`/api/users/socials?id=${linkToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Connection removed");

      await fetchSocials();
      router.refresh();
    } catch (error) {
      console.log(error);
      setLinks(previousLinks);          
      toast.error("Could not delete link");
    }
  };

  if (!isOwnProfile && links.length === 0) {
    return (
      <section className="w-full space-y-4" aria-labelledby="social-connections-heading">
        <SectionHeading id="social-connections-heading" title="Connections" kanji="絆" />
        <div className="flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed border-[#3e2723] bg-[#120c0a]/50 px-6 py-8 text-center">
          <CatSeal className="mb-3 size-9 text-[#8d6e63]/80" />
          <p className="font-serif text-base text-[#eaddcf]/90">
            This member has not shared any connections yet.
          </p>
          <span className="mt-1 text-xs tracking-wide text-[#8d6e63]">
            Their path is still unfolding
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full space-y-4" aria-labelledby="social-connections-heading">
      <SectionHeading id="social-connections-heading" title="Connections" kanji="絆" />

      <div className={panelClass}>
        <ScrollArea className="max-h-[300px] w-full">
          <ul className="divide-y divide-[#3e2723]/70">
            {                        }
            {links.map((link, index) => (
              <li key={link.id}>
                {isOwnProfile && editingIndex === index ? (
                  <SocialLinkEditor
                    initialValue={link.platformUrl}
                    onSave={(val) => handleEdit(index, val)}
                    onCancel={() => setEditingIndex(null)}
                    onDelete={() => handleDelete(index)}
                    isLoading={isLoading}
                  />
                ) : (
                  <SocialLinkItem
                    url={link.platformUrl}
                    isOwnProfile={isOwnProfile}
                    onEdit={() => setEditingIndex(index)}
                  />
                )}
              </li>
            ))}

            {                                  }
            {isOwnProfile && (
              <li>
                {isAdding ? (
                  <SocialLinkEditor
                    initialValue=""
                    onSave={handleCreate}
                    onCancel={() => setIsAdding(false)}
                    isLoading={isLoading}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    className="group flex w-full items-center gap-3 px-4 py-3 text-left text-[#a1887f] transition-colors duration-200 hover:bg-[#2c1810]/40 hover:text-[#eaddcf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d4af37]"
                  >
                    <span className="flex size-9 items-center justify-center rounded-md border border-dashed border-[#5d4037] text-[#d4af37] transition-colors group-hover:border-[#d4af37]/60">
                      <Plus className="size-4" />
                    </span>
                    <span className="text-sm font-medium">Add a connection</span>
                  </button>
                )}
              </li>
            )}
          </ul>
        </ScrollArea>
      </div>
    </section>
  );
}

function SocialLinkItem({
  url,
  isOwnProfile,
  onEdit,
}: {
  url: string;
  isOwnProfile: boolean;
  onEdit: () => void;
}) {
  const info = getPlatform(url);
  const href = url.startsWith("http") ? url : `https://${url}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex items-center justify-between gap-3 px-4 py-3 transition-colors duration-200 hover:bg-[#2c1810]/40 focus-visible:outline-none focus-visible:bg-[#2c1810]/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d4af37]"
    >
      {                                                                                 }
      <span
        aria-hidden="true"
        className="absolute inset-y-2 left-0 w-0.5 origin-center scale-y-0 bg-[#d4af37] transition-transform duration-300 ease-out group-hover:scale-y-100 group-focus-visible:scale-y-100"
      />

      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md border border-[#3e2723]",
            info?.color
          )}
        >
          {info?.icon && (
            <Image
              src={info.icon}
              alt={info.type || "icon"}
              width={16}
              height={16}
              className="h-4 w-4"
            />
          )}
        </div>

        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium capitalize text-[#eaddcf]">
            {info?.type || "Link"}
          </span>
          <span className="truncate text-xs text-[#8d6e63]">
            {url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {isOwnProfile && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
            }}
            type="button"
            aria-label="Edit social connection"
            className="z-10 rounded-md p-2 text-[#8d6e63] transition-colors hover:bg-[#0f0b0a]/60 hover:text-[#d4af37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 text-[#5d4037] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#d4af37] group-focus-visible:text-[#d4af37]"
        />
      </div>
    </a>
  );
}

interface EditorProps {
  initialValue: string;
  onSave: (val: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
}

function SocialLinkEditor({ initialValue, onSave, onCancel, onDelete, isLoading }: EditorProps) {
  const [value, setValue] = useState(initialValue);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onCancel, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isLoading) return;
    if (e.key === "Enter") onSave(value);
    if (e.key === "Escape") onCancel();
  };

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-2 border-l-2 border-[#d4af37] bg-[#1a110d] px-3 py-3 animate-in fade-in duration-200"
    >
      <div className="relative flex-1">
        <LinkIcon className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8d6e63]" />
        <Input
          autoFocus
          disabled={isLoading}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste a profile or website URL"
          aria-label="Social profile or website URL"
          className="h-10 rounded-md border border-[#3e2723] bg-[#0f0b0a]/80 pl-9 text-sm text-[#eaddcf] placeholder:text-[#8d6e63]/70 focus-visible:border-[#d4af37]/60 focus-visible:ring-1 focus-visible:ring-[#d4af37]/40 disabled:opacity-50"
        />
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onSave(value)}
          disabled={isLoading}
          type="button"
          aria-label={isLoading ? "Saving connection" : "Save connection"}
          className="rounded-md bg-[#d4af37] p-2 text-[#0f0b0a] transition-colors hover:bg-[#e2c45a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eaddcf]/70 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        </button>

        {onDelete && (
          <button
            onClick={onDelete}
            disabled={isLoading}
            type="button"
            aria-label="Remove connection"
            className="rounded-md p-2 text-[#8d6e63] transition-colors hover:bg-red-400/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70 disabled:opacity-50"
          >
            <Trash2 className="size-4" />
          </button>
        )}

        <button
          onClick={onCancel}
          disabled={isLoading}
          type="button"
          aria-label="Cancel editing"
          className="rounded-md p-2 text-[#8d6e63] transition-colors hover:bg-[#3e2723]/40 hover:text-[#eaddcf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/70 disabled:opacity-50"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
