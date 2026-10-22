"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { BELTS } from "@/constants/belts";
import Share from "../Discussion/Share";
import SocialsManager from "./SocialManager";
import ReportButton from "./ReportButton";
import { getBeltVisual } from "./BeltCollection";
import { CatSeal, EnsoRing } from "./Profileornaments";

declare interface Props {
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    profileUrl: string | null;
    email: string;
    createdAt: Date;
    socialLinks?: { id: string; platform: string; platformUrl: string }[];
    beltRank: string;
  };
  stats: {
    solved: number;
    discussions: number;
    comments: number;
    reputation: number;
  };
  isOwnProfile?: boolean;
}

// --- CLERK THEME CONFIGURATION ---
const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#d4af37",
    colorBackground: "#0f0b0a",
    colorText: "#eaddcf",
    colorTextSecondary: "#a1887f",
    colorInputBackground: "#1a110d",
    colorInputText: "#eaddcf",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full h-full",
    card: "border border-[#3e2723] shadow-2xl bg-[#0f0b0a] w-full h-full",
    navbar: "hidden",
    navbarButton: "text-[#a1887f] hover:text-[#d4af37]",
    headerTitle: "text-[#d4af37] font-bold font-serif",
    headerSubtitle: "text-[#a1887f]",
    socialButtonsBlockButton: "border-[#3e2723] hover:bg-[#1a110d]",
    formButtonPrimary: "bg-[#d4af37] hover:bg-[#b5952f] text-[#0f0b0a]",
    footerActionLink: "text-[#d4af37] hover:text-[#eaddcf]",
    scrollBox: "bg-[#0f0b0a]",
  },
};

const DEFAULT_BIO = "Training one problem at a time.";

export function UserDetails({ user, stats, isOwnProfile }: Props) {
  const router = useRouter();

  // --- BIO EDITING STATE ---
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [savedBio, setSavedBio] = useState(user.bio || DEFAULT_BIO);
  const [bioText, setBioText] = useState(savedBio);
  const [isSavingBio, setIsSavingBio] = useState(false);

  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Ninja";
  const currentBelt = BELTS.findLast((b) => b.key === user.beltRank) || BELTS[0];
  const beltVisual = getBeltVisual(currentBelt.name);

  const handleSaveBio = async () => {
    setIsSavingBio(true);
    try {
      const res = await fetch("/api/users/bio", {
        method: "PATCH",
        body: JSON.stringify({ bio: bioText }),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success("Bio saved");
      setSavedBio(bioText);
      setIsEditingBio(false);
      router.refresh();
    } catch {
      toast.error("Unable to save bio");
    } finally {
      setIsSavingBio(false);
    }
  };

  const cancelBioEdit = () => {
    setBioText(savedBio);
    setIsEditingBio(false);
  };

  return (
    <header>
      {/* --- ACTIONS --- */}
      <div className="flex items-center justify-between gap-3">
        <div>
          {!isOwnProfile && <ReportButton targetUserId={user.id} targetUserName={user.name!} />}
        </div>

        <div className="flex items-center gap-3">
          {isOwnProfile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-full border border-[#3e2723] px-4 text-[#eaddcf] hover:border-[#d4af37] hover:bg-transparent hover:text-[#d4af37]"
                >
                  Manage account
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-full border-l border-[#d4af37]/60 bg-[#0f0b0a] p-0 z-9999 sm:max-w-5xl [&>button]:top-4 [&>button]:right-4 [&>button]:size-8 [&>button]:rounded-full [&>button]:border [&>button]:border-[#3e2723] [&>button]:bg-[#1a110d] [&>button]:text-[#d4af37] [&>button]:transition-colors [&>button]:hover:bg-[#d4af37] [&>button]:hover:text-black [&>button_svg]:size-4"
              >
                <SheetTitle className="sr-only">Edit profile</SheetTitle>
                <SheetDescription className="sr-only">
                  Update your account settings
                </SheetDescription>

                <div className="flex h-full w-full flex-col items-center justify-center overflow-y-auto p-4 md:p-8">
                  <div className="relative flex h-full max-h-[800px] w-full justify-center">
                    <UserProfile routing="hash" appearance={clerkAppearance} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
          <Share />
        </div>
      </div>

      {/* --- IDENTITY --- */}
      <div className="mt-6 flex flex-col items-center gap-8 text-center md:mt-8 md:flex-row md:items-start md:gap-14 md:text-left">
        {/* Avatar inside an open enso */}
        <div className="relative size-40 shrink-0 text-[#d4af37] md:size-52">
          <EnsoRing />
          <div className="absolute inset-[9%] overflow-hidden rounded-full bg-[#1a110d]">
            {user.profileUrl ? (
              <Image
                src={user.profileUrl}
                alt={fullName}
                fill
                sizes="208px"
                className="object-cover"
                priority
              />
            ) : (
              <span className="flex size-full items-center justify-center font-serif text-5xl text-[#a1887f]">
                {fullName.charAt(0)}
              </span>
            )}
          </div>
          <CatSeal className="absolute -bottom-1 right-1 size-9 bg-[#0f0b0a] p-1 text-[#d4af37]" />
        </div>

        <div className="min-w-0 flex-1 md:pt-4">
          <h1 className="font-serif text-4xl font-medium leading-tight tracking-tight text-[#eaddcf] md:text-6xl">
            {fullName}
          </h1>

          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-[#a1887f] md:justify-start">
            <Link
              href={`/member/${user.name}`}
              className="text-[#d4af37] underline-offset-4 hover:underline"
            >
              @{user.name}
            </Link>
            <span>Training since {joinDate}</span>
            {isOwnProfile && <span>{user.email}</span>}
          </p>

          <p className="mt-4 flex items-center justify-center gap-3 md:justify-start">
            <span
              aria-hidden
              className="h-1.5 w-10 rounded-full border border-white/10"
              style={{ backgroundColor: beltVisual.hex }}
            />
            <span className="text-sm text-[#eaddcf]">{currentBelt.name}</span>
            {beltVisual.kanji && (
              <span lang="ja" className="text-sm text-[#8d6e63]">
                {beltVisual.kanji}
              </span>
            )}
          </p>

          {/* --- BIO --- */}
          <div className="mt-8 max-w-prose">
            {isOwnProfile && isEditingBio ? (
              <div className="space-y-3 text-left">
                <Textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  aria-label="Bio"
                  className="min-h-[110px] rounded-md border-[#3e2723] bg-[#1a110d] font-serif text-base leading-relaxed text-[#eaddcf] focus-visible:ring-[#d4af37]"
                  placeholder="Write a few lines about your practice."
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancelBioEdit}
                    className="text-[#a1887f] hover:bg-transparent hover:text-[#eaddcf]"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveBio}
                    disabled={isSavingBio}
                    className="rounded-full bg-[#d4af37] px-5 text-[#0f0b0a] hover:bg-[#b5952f]"
                  >
                    {isSavingBio ? "Saving…" : "Save bio"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-serif text-lg leading-8 text-[#eaddcf]/90">{savedBio}</p>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => setIsEditingBio(true)}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#8d6e63] transition-colors hover:text-[#d4af37]"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Edit bio
                  </button>
                )}
              </>
            )}
          </div>

          <div className="mt-6 max-w-3xl">
            <SocialsManager initialLinks={user.socialLinks} isOwnProfile={isOwnProfile} />
          </div>
        </div>
      </div>

      {/* --- STATS: one ruled strip --- */}
      <dl className="mt-12 grid grid-cols-2 border-y border-[#3e2723] md:mt-16 md:grid-cols-4">
        <Stat label="Solved" value={stats.solved} />
        <Stat label="Discussions" value={stats.discussions} />
        <Stat label="Comments" value={stats.comments} />
        <Stat label="Reputation" value={stats.reputation} />
      </dl>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-[#3e2723] px-4 py-5 md:px-6 md:py-6 nth-[2n]:border-l nth-[n+3]:border-t md:nth-[n+2]:border-l md:nth-[n+3]:border-t-0">
      <dt className="text-sm text-[#a1887f]">{label}</dt>
      <dd className="mt-1 font-serif text-3xl tabular-nums text-[#eaddcf] md:text-4xl">{value}</dd>
    </div>
  );
}
