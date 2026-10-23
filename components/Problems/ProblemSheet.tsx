"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Unlock, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { DojoProgress } from "../ui/dojo-progress";
import { SHELF_BUTTONS } from "@/constants/shelfs";

type QuestionStatus = "unvisited" | "attempted" | "completed";
type Difficulty = "Easy" | "Medium" | "Hard";
type ShelfType = "later" | "revisit" | "important" | "stuck";

function isQuestionProgress(
  value: unknown
): value is { questionId: string; status: QuestionStatus } {
  return (
    typeof value === "object" &&
    value !== null &&
    "questionId" in value &&
    typeof value.questionId === "string" &&
    "status" in value &&
    (value.status === "unvisited" || value.status === "attempted" || value.status === "completed")
  );
}

function isQuestionShelf(value: unknown): value is { questionId: string; type: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "questionId" in value &&
    typeof value.questionId === "string" &&
    "type" in value &&
    typeof value.type === "string"
  );
}

interface Question {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  externalPlatformUrl: string;
  solutionUrl: string | null;
}

interface Category {
  id: string;
  name: string;
  questions: Question[];
}

interface Props {
  data: Category[];
}

const BELT: Record<Difficulty, { bar: string; text: string }> = {
  Easy: { bar: "bg-green-500", text: "text-green-400" },
  Medium: { bar: "bg-yellow-500", text: "text-yellow-400" },
  Hard: { bar: "bg-red-500", text: "text-red-400" },
};

export default function QuestionExplorer({ data }: Props) {
  const [progress, setProgress] = useState<Record<string, QuestionStatus>>({});
  const [shelfState, setShelfState] = useState<Record<string, ShelfType | null>>({});
  const [loadingShelf, setLoadingShelf] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const syncUserData = async () => {
      try {
        const progRes = await fetch("/api/progress");
        if (progRes.ok) {
          const progData: unknown = await progRes.json();
          const progressMap: Record<string, QuestionStatus> = {};
          if (Array.isArray(progData)) {
            progData.forEach((item: unknown) => {
              if (isQuestionProgress(item)) {
                progressMap[item.questionId] = item.status;
              }
            });
          }
          setProgress(progressMap);
        }

        const shelfRes = await fetch("/api/shelf");
        if (shelfRes.ok) {
          const shelfData: unknown = await shelfRes.json();
          const shelfMap: Record<string, ShelfType> = {};
          if (Array.isArray(shelfData)) {
            shelfData.forEach((item: unknown) => {
              if (isQuestionShelf(item)) {
                const type = item.type.toLowerCase();
                if (
                  type === "later" ||
                  type === "revisit" ||
                  type === "important" ||
                  type === "stuck"
                ) {
                  shelfMap[item.questionId] = type;
                }
              }
            });
          }
          setShelfState(shelfMap);
        }
      } catch (error) {
        console.error("Sync error", error);
      }
    };

    syncUserData();
  }, []);

  const handleAttempt = async (q: Question) => {
    const currentStatus = progress[q.id] || "unvisited";
    if (currentStatus !== "unvisited") return;
    setProgress((prev) => ({ ...prev, [q.id]: "attempted" }));

    try {
      await fetch(`/api/progress/attempted?questionId=${q.id}`, { method: "PATCH" });
    } catch {
      toast.error("Could not save progress");
      setProgress((prev) => ({ ...prev, [q.id]: "unvisited" }));
    }
  };

  const toggleSolved = async (qId: string, isChecked: boolean) => {
    const previousStatus = progress[qId];
    setProgress((prev) => ({
      ...prev,
      [qId]: isChecked ? "completed" : "attempted",
    }));

    try {
      await fetch(`/api/progress/status?questionId=${qId}`, { method: "PATCH" });
    } catch {
      toast.error("Failed to save progress");
      setProgress((prev) => ({ ...prev, [qId]: previousStatus }));
    }
  };

  const toggleShelf = async (qId: string, type: ShelfType) => {
    const previousType = shelfState[qId];
    setLoadingShelf((prev) => ({ ...prev, [qId]: true }));

    const newType = previousType === type ? null : type;
    setShelfState((prev) => ({ ...prev, [qId]: newType }));

    try {
      const res = await fetch(`/api/shelf?questionId=${qId}&type=${type}`, {
        method: "PATCH",
      });

      if (!res.ok) throw new Error("Failed");

      const msg = newType ? `Added to ${type} shelf` : `Removed from shelf`;
      toast.success(msg);
    } catch {
      toast.error("Failed to update shelf");
      setShelfState((prev) => ({ ...prev, [qId]: previousType }));          
    } finally {
      setLoadingShelf((prev) => ({ ...prev, [qId]: false }));
    }
  };

  return (
    <div className="w-full space-y-4">
      <Accordion type="single" collapsible className="space-y-3">
        {data.map((category, catIdx) => {
          const totalQuestions = category.questions.length;
          const solvedCount = category.questions.filter(
            (q) => progress[q.id] === "completed"
          ).length;
          const percentComplete =
            totalQuestions > 0 ? Math.round((solvedCount / totalQuestions) * 100) : 0;
          const isCategoryCompleted = percentComplete === 100;
          const numeral = String(catIdx + 1);

          return (
            <AccordionItem
              key={category.id}
              value={category.id}
              className={cn(
                "group/cat relative overflow-hidden rounded-lg border bg-linear-to-br from-[#1a110d] to-[#120c0a] transition-colors duration-300",
                "data-[state=open]:shadow-[0_18px_36px_-24px_rgba(0,0,0,0.9)]",
                isCategoryCompleted
                  ? "border-[#d4af37]/40"
                  : "border-[#3e2723] hover:border-[#5d4037] data-[state=open]:border-[#5d4037]"
              )}
            >
              {                     }
              <AccordionTrigger className="group px-4 py-4 hover:no-underline sm:px-5">
                <div className="flex w-full items-center gap-4 pr-3">
                  {                                 }
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-md border font-serif transition-colors duration-300",
                      numeral.length > 1 ? "text-sm" : "text-xl",
                      isCategoryCompleted
                        ? "border-[#d4af37] bg-[#d4af37] text-[#1a110d]"
                        : "border-[#5d4037] bg-[#2c1810] text-[#d4af37] group-hover:border-[#d4af37]/60"
                    )}
                  >
                    {numeral}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2.5 text-left">
                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        className={cn(
                          "truncate font-serif text-base font-semibold tracking-wide transition-colors sm:text-lg",
                          isCategoryCompleted
                            ? "text-[#d4af37]"
                            : "text-[#eaddcf] group-hover:text-[#d4af37]"
                        )}
                      >
                        {category.name}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-[#a1887f]">
                        {isCategoryCompleted && (
                          <span className="mr-2 hidden text-[#d4af37] sm:inline">Completed</span>
                        )}
                        {solvedCount} / {totalQuestions}
                        <span className="ml-1.5 text-[#5d4037]">{percentComplete}%</span>
                      </span>
                    </div>
                    <DojoProgress value={percentComplete} />
                  </div>
                </div>
              </AccordionTrigger>

              {             }
              <AccordionContent className="relative pb-4 pt-0">
                {                                         }
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-2 right-4 select-none font-serif text-8xl text-[#d4af37]/4"
                >
                  型
                </span>

                <div className="relative mx-4 border-t border-[#3e2723]/70 pt-3 sm:mx-5">
                  {category.questions.length === 0 ? (
                    <div className="py-3 text-sm italic text-[#5d4037]">No katas available.</div>
                  ) : (
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((q, idx) => {
                        const status = progress[q.id] || "unvisited";
                        const isSolved = status === "completed";
                        const isAttempted = status === "attempted" || isSolved;

                        const activeShelf = shelfState[q.id];
                        const isLoadingThisShelf = loadingShelf[q.id];
                        const belt = BELT[q.difficulty];

                        return (
                          <AccordionItem
                            key={q.id}
                            value={q.id}
                            className="mb-1 rounded-md border-b-0 transition-colors data-[state=open]:bg-[#0f0b0a]/50"
                          >
                            <div className="group/q relative flex w-full items-center rounded-md pr-2 transition-colors hover:bg-[#2c1810]/40">
                              {                                                }
                              <span
                                aria-hidden="true"
                                className="absolute inset-y-2 left-0 w-0.5 origin-center scale-y-0 bg-[#d4af37] transition-transform duration-300 ease-out group-hover/q:scale-y-100"
                              />

                              {              }
                              <div className="flex items-center py-3 pl-4">
                                <Checkbox
                                  checked={isSolved}
                                  onCheckedChange={(checked) =>
                                    toggleSolved(q.id, checked as boolean)
                                  }
                                  disabled={status === "unvisited"}
                                  aria-label={`Mark ${q.title} as solved`}
                                  className={cn(
                                    "size-5 rounded-[5px] border-[#5d4037] transition-all data-[state=checked]:border-[#d4af37] data-[state=checked]:bg-[#d4af37] data-[state=checked]:text-[#1a110d]",
                                    status === "unvisited" && "cursor-not-allowed opacity-30"
                                  )}
                                />
                              </div>

                              {                     }
                              <AccordionTrigger className="flex-1 px-4 py-3 hover:no-underline">
                                <div className="flex w-full items-center gap-4">
                                  <span className="w-5 shrink-0 text-xs tabular-nums text-[#5d4037]">
                                    {(idx + 1).toString().padStart(2, "0")}
                                  </span>
                                  <span
                                    className={cn(
                                      "flex-1 text-left text-sm font-medium transition-all",
                                      isSolved
                                        ? "text-[#a1887f] line-through decoration-[#5d4037]"
                                        : "text-[#eaddcf] group-hover/q:text-[#d4af37]"
                                    )}
                                  >
                                    {q.title}
                                  </span>

                                  <div className="ml-auto flex items-center gap-3">
                                    {                     }
                                    {activeShelf && (
                                      <span
                                        className={cn(
                                          "size-2 rounded-full",
                                          activeShelf === "important" && "bg-yellow-500",
                                          activeShelf === "stuck" && "bg-red-500",
                                          activeShelf === "revisit" && "bg-orange-500",
                                          activeShelf === "later" && "bg-blue-500"
                                        )}
                                      />
                                    )}

                                    {                          }
                                    <span
                                      className={cn(
                                        "hidden items-center gap-2 text-[11px] sm:flex",
                                        belt.text
                                      )}
                                    >
                                      <span className={cn("h-1.5 w-4 rounded-full", belt.bar)} />
                                      {q.difficulty}
                                    </span>

                                    {                         }
                                    <span className="flex size-4 items-center justify-center">
                                      {isSolved && (
                                        <Paw className="animate-in zoom-in size-4 -rotate-12 text-[#d4af37] duration-300" />
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </AccordionTrigger>
                            </div>

                            {                      }
                            <AccordionContent className="px-4 pb-5 pt-1 sm:px-6">
                              <div className="space-y-4">
                                {                                         }
                                <p className="rounded-md border border-[#3e2723] border-l-2 border-l-[#d4af37]/50 bg-[#0f0b0a]/60 px-4 py-3 text-sm leading-relaxed text-[#a1887f]">
                                  {q.description}
                                </p>

                                {                        }
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                  <div className="flex gap-3">
                                    <Button
                                      asChild
                                      size="sm"
                                      onClick={() => handleAttempt(q)}
                                      className="h-9 rounded-md bg-[#d4af37] px-4 font-semibold text-[#1a110d] hover:bg-[#c5a028]"
                                    >
                                      <Link
                                        href={`/problems/${encodeURIComponent(q.slug)}`}
                                        className="flex items-center gap-2"
                                      >
                                        <Play className="size-3.5 fill-current" />
                                        Solve <span className="hidden sm:inline">Problem</span>
                                      </Link>
                                    </Button>

                                    {q.solutionUrl && (
                                      <Button
                                        asChild={isAttempted}
                                        disabled={!isAttempted}
                                        size="sm"
                                        variant="outline"
                                        className={cn(
                                          "flex h-9 items-center gap-2 rounded-md border-[#3e2723] bg-transparent px-4 transition-all",
                                          isAttempted
                                            ? "cursor-pointer text-[#eaddcf] hover:border-[#d4af37] hover:bg-[#2c1810]/40 hover:text-[#d4af37]"
                                            : "cursor-not-allowed text-[#5d4037] opacity-60 hover:bg-transparent"
                                        )}
                                      >
                                        {isAttempted ? (
                                          <Link
                                            href={q.solutionUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2"
                                          >
                                            <Unlock className="size-3.5" />
                                            <span>View Solution</span>
                                          </Link>
                                        ) : (
                                          <span className="flex items-center gap-2">
                                            <Lock className="size-3.5" />
                                            <span>Solution </span>
                                            <span className="hidden sm:inline">Locked</span>
                                          </span>
                                        )}
                                      </Button>
                                    )}
                                  </div>

                                  {                                   }
                                  <div className="flex items-center gap-3">
                                    <div className="mr-1 hidden flex-col items-end sm:flex">
                                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#5d4037]">
                                        Shelf
                                      </span>
                                      {activeShelf && (
                                        <span
                                          className={cn(
                                            "text-[10px] font-mono",
                                            activeShelf === "important" && "text-yellow-500",
                                            activeShelf === "later" && "text-blue-400",
                                            activeShelf === "stuck" && "text-red-500",
                                            activeShelf === "revisit" && "text-orange-400"
                                          )}
                                        >
                                          {activeShelf.toUpperCase()}
                                        </span>
                                      )}
                                    </div>

                                    {                                            }
                                    <div className="flex items-center gap-1 rounded-lg border border-[#3e2723] bg-[#0f0b0a] p-1.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                                      {isLoadingThisShelf ? (
                                        <Loader2 className="mx-6 size-4 animate-spin text-[#a1887f]" />
                                      ) : (
                                        <TooltipProvider delayDuration={100}>
                                          {SHELF_BUTTONS.map((btn) => {
                                            const isActive = activeShelf === btn.type;

                                            return (
                                              <Tooltip key={btn.type}>
                                                <TooltipTrigger asChild>
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();                              
                                                      toggleShelf(q.id, btn.type);
                                                    }}
                                                    className={cn(
                                                      "relative flex size-8 items-center justify-center rounded-md border border-transparent transition-all duration-300",
                                                      isActive
                                                        ? `${btn.activeColor} z-10 scale-110 shadow-[0_0_12px_-3px_currentColor]`
                                                        : `text-[#5d4037] hover:bg-[#3e2723]/40 ${btn.hoverColor} hover:scale-105`
                                                    )}
                                                  >
                                                    <btn.icon
                                                      className={cn(
                                                        "size-4 transition-all duration-300",
                                                        isActive && "fill-current"
                                                      )}
                                                    />
                                                    {isActive && (
                                                      <span className="absolute -bottom-1 size-1 rounded-full bg-current" />
                                                    )}
                                                  </button>
                                                </TooltipTrigger>
                                                <TooltipContent className="border-[#3e2723] text-xs text-[#eaddcf]">
                                                  <p>
                                                    {isActive ? "Remove from " : "Add to "}
                                                    <span className="font-bold">{btn.label}</span>
                                                  </p>
                                                </TooltipContent>
                                              </Tooltip>
                                            );
                                          })}
                                        </TooltipProvider>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {!isAttempted && (
                                  <p className="flex items-center gap-2 text-[11px] italic text-[#5d4037]">
                                    <Lock className="size-3 shrink-0" />
                                    The solution scroll is sealed. Attempt the kata to break the
                                    seal.
                                  </p>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

function Paw({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <ellipse cx="12" cy="16" rx="5" ry="4" />
      <circle cx="5" cy="10" r="2.2" />
      <circle cx="9.5" cy="5.5" r="2.2" />
      <circle cx="14.5" cy="5.5" r="2.2" />
      <circle cx="19" cy="10" r="2.2" />
    </svg>
  );
}
