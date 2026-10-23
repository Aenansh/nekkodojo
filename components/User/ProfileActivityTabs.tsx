"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionHeading, CatSeal } from "./Profileornaments";

interface SolvedQuestion {
  id: string;
  updatedAt: Date;
  question: {
    id: string;
    title: string;
    difficulty: string;
    slug: string;
    externalPlatformUrl: string;
  };
}

interface Discussion {
  id: string;
  title: string;
  createdAt: Date;
  likeCount: number;
  dislikeCount: number;
  _count: { comments: number };
}

interface Comment {
  id: string;
  description: string;
  createdAt: Date;
  discussion: { id: string; title: string };
}

interface Props {
  solvedQuestions: SolvedQuestion[];
  discussions: Discussion[];
  comments: Comment[];
}

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: "#8fb573",
  Medium: "#d99a4e",
  Hard: "#c4574a",
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const ago = (date: Date) => formatDistanceToNow(new Date(date), { addSuffix: true });

const rowClass =
  "group block border-b border-[#3e2723]/60 px-1 py-4 transition-colors hover:bg-[#1a110d]/60 focus-visible:outline-none focus-visible:bg-[#1a110d]";

export function ProfileActivityTabs({ solvedQuestions, discussions, comments }: Props) {
  return (
    <section aria-labelledby="activity-heading">
      <SectionHeading id="activity-heading" title="Recent activity" kanji="記録" />

      <Tabs defaultValue="solved" className="mt-6 w-full gap-0">
        <div className="overflow-x-auto scrollbar-hide">
          <TabsList className="h-auto w-max min-w-full justify-start gap-8 rounded-none border-b border-[#3e2723] bg-transparent p-0">
            <TabButton value="solved" label="Solved" count={solvedQuestions.length} />
            <TabButton value="discussions" label="Discussions" count={discussions.length} />
            <TabButton value="comments" label="Comments" count={comments.length} />
          </TabsList>
        </div>

        {                    }
        <TabsContent value="solved" className="mt-0">
          <ScrollArea className="h-112 w-full">
            {solvedQuestions.length > 0 ? (
              <ul>
                {solvedQuestions.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/problems/${encodeURIComponent(item.question.slug)}`}
                      className={`${rowClass} flex items-baseline justify-between gap-6`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[#eaddcf] transition-colors group-hover:text-[#d4af37]">
                          {item.question.title}
                        </span>
                        <span className="mt-1 flex items-center gap-2 text-sm text-[#a1887f]">
                          <span
                            aria-hidden
                            className="size-1.5 rounded-full"
                            style={{
                              backgroundColor:
                                DIFFICULTY_COLOR[item.question.difficulty] ?? "#a1887f",
                            }}
                          />
                          {item.question.difficulty}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm text-[#8d6e63]">{ago(item.updatedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState label="No problems solved yet." />
            )}
          </ScrollArea>
        </TabsContent>

        {                         }
        <TabsContent value="discussions" className="mt-0">
          <ScrollArea className="h-112 w-full">
            {discussions.length > 0 ? (
              <ul>
                {discussions.map((disc) => (
                  <li key={disc.id}>
                    <Link href={`/discussions/${disc.id}`} className={rowClass}>
                      <span className="block truncate text-[#eaddcf] transition-colors group-hover:text-[#d4af37]">
                        {disc.title}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#a1887f]">
                        <span>{ago(disc.createdAt)}</span>
                        <span>{plural(disc.likeCount, "like", "likes")}</span>
                        <span>{plural(disc._count.comments, "comment", "comments")}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState label="No discussions started." />
            )}
          </ScrollArea>
        </TabsContent>

        {                      }
        <TabsContent value="comments" className="mt-0">
          <ScrollArea className="h-112 w-full">
            {comments.length > 0 ? (
              <ul>
                {comments.map((comment) => (
                  <li key={comment.id}>
                    <Link href={`/discussions/${comment.discussion.id}`} className={rowClass}>
                      <span className="block text-sm text-[#a1887f]">
                        On{" "}
                        <span className="text-[#eaddcf] transition-colors group-hover:text-[#d4af37]">
                          {comment.discussion.title}
                        </span>
                        <span className="ml-3 text-[#8d6e63]">{ago(comment.createdAt)}</span>
                      </span>
                      <span className="mt-2 line-clamp-2 block border-l border-[#3e2723] pl-4 font-serif leading-relaxed text-[#eaddcf]/80 transition-colors group-hover:border-[#d4af37]">
                        {comment.description}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState label="No comments yet." />
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </section>
  );
}


function TabButton({ value, label, count }: { value: string; label: string; count: number }) {
  return (
    <TabsTrigger
      value={value}
      className="-mb-px h-auto flex-none gap-2 rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-3 pt-2 text-[#8d6e63] shadow-none transition-colors hover:text-[#eaddcf] data-[state=active]:border-[#d4af37] data-[state=active]:bg-transparent data-[state=active]:text-[#eaddcf] data-[state=active]:shadow-none dark:data-[state=active]:border-[#d4af37] dark:data-[state=active]:bg-transparent"
    >
      {label}
      <span className="text-xs tabular-nums text-[#8d6e63]">{count}</span>
    </TabsTrigger>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-3 text-[#8d6e63]">
      <CatSeal className="size-8 text-[#5d4037]" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
