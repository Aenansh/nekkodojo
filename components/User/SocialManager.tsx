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
  ExternalLink,
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

export default function SocialsManager({
  initialLinks, // REMOVED default value = [] to prevent infinite loop
  isOwnProfile = false,
}: Props) {
  const router = useRouter();
  
  // Safe fallback inside body
  const safeLinks = initialLinks || [];

  const [links, setLinks] = useState<SocialLink[]>(safeLinks);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- 1. SYNC & FETCH DATA ---
  
  // Fetch fresh data from DB (Only for Owner)
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

  // Sync state when props change (Critical for visitors)
  useEffect(() => {
    if (initialLinks) {
      setLinks(initialLinks);
    }
  }, [initialLinks]);

  // Fetch fresh data on mount if owner (Critical for editing consistency)
  useEffect(() => {
    if (isOwnProfile) {
      fetchSocials();
    }
  }, [isOwnProfile, fetchSocials]);


  // --- CRUD OPERATIONS ---

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
      
      // Refresh local data & Server Components
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
      console.log(error)
      toast.error("Update failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (index: number) => {
    const linkToDelete = links[index];
    const previousLinks = [...links];

    // Optimistic Update
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
      console.log(error)
      setLinks(previousLinks); // Revert
      toast.error("Could not delete link");
    }
  };

  // --- VISITOR VIEW (Empty State) ---
  if (!isOwnProfile && links.length === 0) {
    return (
      <section className="w-full space-y-4" aria-labelledby="social-connections-heading">
        <SectionHeading id="social-connections-heading" title="Connections" kanji="絆" />
        <div className="relative flex min-h-36 flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#5d4037]/70 bg-[linear-gradient(145deg,rgba(44,24,16,0.35),rgba(15,11,10,0.5))] px-6 py-7 text-center">
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

      <ScrollArea className="max-h-[300px] w-full rounded-2xl border border-[#3e2723] bg-[linear-gradient(145deg,rgba(26,17,13,0.68),rgba(15,11,10,0.52))] p-2.5 shadow-[inset_0_1px_0_rgba(234,221,207,0.025)]">
        <div className="space-y-2.5 pr-3">
          {/* --- LINKS LIST --- */}
          {links.map((link, index) => {
            if (isOwnProfile && editingIndex === index) {
              return (
                <SocialLinkEditor
                  key={link.id}
                  initialValue={link.platformUrl}
                  onSave={(val) => handleEdit(index, val)}
                  onCancel={() => setEditingIndex(null)}
                  onDelete={() => handleDelete(index)}
                  isLoading={isLoading}
                />
              );
            }

            return (
              <SocialLinkItem
                key={link.id}
                url={link.platformUrl}
                isOwnProfile={isOwnProfile}
                onEdit={() => setEditingIndex(index)}
              />
            );
          })}

          {/* --- ADD BUTTON (Owner Only) --- */}
          {isOwnProfile && (
            <>
              {isAdding ? (
                <SocialLinkEditor
                  initialValue=""
                  onSave={handleCreate}
                  onCancel={() => setIsAdding(false)}
                  isLoading={isLoading}
                />
              ) : (
                <button
                  onClick={() => setIsAdding(true)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-[#5d4037]/70 p-3 text-left text-[#a1887f] transition-all duration-300 hover:border-[#d4af37]/60 hover:bg-[#2c1810]/30 hover:text-[#eaddcf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg border border-[#3e2723] bg-[#0f0b0a]/70 text-[#d4af37] transition-colors group-hover:border-[#d4af37]/30">
                    <Plus className="size-4" />
                  </div>
                  <span className="text-sm font-medium">Add a connection</span>
                </button>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </section>
  );
}

// --- SUB-COMPONENT: DISPLAY ITEM ---
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
  // Ensure valid URL for href
  const href = url.startsWith("http") ? url : `https://${url}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative flex items-center justify-between rounded-xl border border-[#3e2723]/90 bg-[#120c0a]/60 p-2.5 transition-all duration-200 hover:bg-[#1a110d]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]",
        isOwnProfile ? "hover:border-[#d4af37]/45" : "hover:border-[#d4af37]/60"
      )}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/5",
            info?.color
          )}
        >
          {info?.icon && (
            <Image
              src={info.icon}
              alt={info.type || "icon"}
              width={16}
              height={16}
              className="w-4 h-4"
            />
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <span className="flex items-center gap-2 truncate text-sm font-medium capitalize text-[#eaddcf]">
            {info?.type || "Link"}
            <ExternalLink className="size-3 text-[#8d6e63] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
          </span>
          <span className="truncate text-xs text-[#8d6e63]">
            {url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </span>
        </div>
      </div>

      {isOwnProfile && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
          type="button"
          aria-label="Edit social connection"
          className="z-10 ml-2 rounded-lg p-2 text-[#8d6e63] transition-colors hover:bg-[#3e2723]/40 hover:text-[#d4af37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
        >
          <Pencil className="size-3.5" />
        </button>
      )}
    </a>
  );
}

// --- SUB-COMPONENT: EDITOR ---
interface EditorProps {
  initialValue: string;
  onSave: (val: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
}

function SocialLinkEditor({
  initialValue,
  onSave,
  onCancel,
  onDelete,
  isLoading,
}: EditorProps) {
  const [value, setValue] = useState(initialValue);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lock click outside while loading to prevent accidental cancel
    if (isLoading) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
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
      className="flex items-center gap-2 rounded-xl border border-[#d4af37]/50 bg-[#120c0a]/95 p-2 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(234,221,207,0.04)] animate-in fade-in zoom-in-95 duration-200"
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
          className="h-10 rounded-lg border border-[#3e2723] bg-[#0f0b0a]/80 pl-9 text-sm text-[#eaddcf] placeholder:text-[#8d6e63]/70 focus-visible:border-[#d4af37]/60 focus-visible:ring-1 focus-visible:ring-[#d4af37]/40 disabled:opacity-50"
        />
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onSave(value)}
          disabled={isLoading}
          type="button"
          aria-label={isLoading ? "Saving connection" : "Save connection"}
          className="rounded-lg bg-[#d4af37] p-2 text-[#0f0b0a] transition-colors hover:bg-[#e2c45a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eaddcf]/70 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
        </button>

        {onDelete && (
          <button
            onClick={onDelete}
            disabled={isLoading}
            type="button"
            aria-label="Remove connection"
            className="rounded-lg p-2 text-[#8d6e63] transition-colors hover:bg-red-400/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70 disabled:opacity-50"
          >
            <Trash2 className="size-4" />
          </button>
        )}

        <button
          onClick={onCancel}
          disabled={isLoading}
          type="button"
          aria-label="Cancel editing"
          className="rounded-lg p-2 text-[#8d6e63] transition-colors hover:bg-[#3e2723]/40 hover:text-[#eaddcf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/70 disabled:opacity-50"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}