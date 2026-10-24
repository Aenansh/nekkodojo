"use client";

import { useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Trash2, ArrowUpRight, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteDiscussion } from "@/app/(admin)/(protected)/_actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DiscussionProps {
  id: string;
  title: string;
  author: {
    firstName: string | null;
    lastName: string | null;
    profileUrl: string | null;
  };
  likeCount: number;
  _count: {
    comments: number;
  };
  createdAt: Date;
}

export function AdminContentItem({ data }: { data: DiscussionProps }) {
  const [isPending, startTransition] = useTransition();

  const executeDelete = async () => {
    const formData = new FormData();
    formData.append("id", data.id);

    startTransition(async () => {
      try {
        await deleteDiscussion(formData);
        toast.success("Discussion deleted");
      } catch (error) {
        console.error(error);
        toast.error("Unable to delete discussion");
      }
    });
  };

  const authorName = `${data.author.firstName || "Unknown"} ${data.author.lastName || ""}`.trim();
  const commentCount = data._count.comments;

  return (
    <article
      aria-busy={isPending}
      className={cn(
        "grid gap-x-8 gap-y-4 border-b border-[#3e2723]/60 px-2 py-5 transition-colors hover:bg-[#1a110d]/60 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center",
        isPending && "opacity-50"
      )}
    >
      <div className="min-w-0">
        <Link
          href={`/discussions/${data.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex max-w-full items-center gap-2 font-serif text-lg text-[#eaddcf] transition-colors hover:text-[#d4af37]"
        >
          <span className="truncate">{data.title}</span>
          <ArrowUpRight
            className="size-4 shrink-0 text-[#8d6e63] transition-colors group-hover:text-[#d4af37]"
            aria-hidden
          />
          <span className="sr-only">(opens in a new tab)</span>
        </Link>

        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#a1887f]">
          <span className="flex items-center gap-2">
            <Avatar className="size-5 border border-[#3e2723]">
              <AvatarImage src={data.author.profileUrl || ""} alt="" />
              <AvatarFallback className="bg-[#3e2723] text-[10px] text-[#eaddcf]">
                {authorName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {authorName}
          </span>
          <time
            dateTime={new Date(data.createdAt).toISOString()}
            suppressHydrationWarning
            className="text-[#8d6e63]"
          >
            {format(new Date(data.createdAt), "MMM d, yyyy")}
          </time>
        </p>
      </div>

      {/* Engagement: two figures, number over label */}
      <dl className="flex gap-8 md:border-l md:border-[#3e2723]/60 md:px-8">
        <Figure label={data.likeCount === 1 ? "like" : "likes"} value={data.likeCount} />
        <Figure label={commentCount === 1 ? "comment" : "comments"} value={commentCount} />
      </dl>

      <div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              className="h-8 px-3 text-sm text-[#8d6e63] hover:bg-transparent hover:text-[#d4796b]"
            >
              {isPending ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="mr-1.5 size-3.5" aria-hidden />
              )}
              Delete
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent className="border-[#3e2723] bg-[#1a110d] text-[#eaddcf]">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif text-xl text-[#eaddcf]">
                Delete this discussion?
              </AlertDialogTitle>
              <AlertDialogDescription className="leading-relaxed text-[#a1887f]">
                {commentCount > 0
                  ? `It will be permanently removed along with its ${commentCount} ${commentCount === 1 ? "comment" : "comments"}. This can't be undone.`
                  : "It will be permanently removed. This can't be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <p className="border-l border-[#3e2723] pl-4 font-serif leading-relaxed text-[#eaddcf]/80">
              {data.title}
            </p>

            <AlertDialogFooter>
              <AlertDialogCancel className="border-[#3e2723] bg-transparent text-[#eaddcf] hover:bg-[#0f0b0a] hover:text-[#eaddcf]">
                Keep discussion
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={executeDelete}
                className="bg-[#8f3b31] text-[#eaddcf] hover:bg-[#a6453a]"
              >
                Delete discussion
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </article>
  );
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col-reverse items-start">
      <dt className="text-xs text-[#8d6e63]">{label}</dt>
      <dd className="font-serif text-xl tabular-nums leading-none text-[#eaddcf]">{value}</dd>
    </div>
  );
}
