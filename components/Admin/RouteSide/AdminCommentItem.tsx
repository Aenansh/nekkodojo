"use client";

import { useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Trash2, Loader2, ArrowUpRight } from "lucide-react";
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
import { deleteComment } from "@/app/(admin)/(protected)/_actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CommentProps {
  id: string;
  description: string;
  createdAt: Date;
  author: {
    firstName: string | null;
    lastName: string | null;
    profileUrl: string | null;
  };
  discussion: {
    id: string;
    title: string;
  };
}

export function AdminCommentItem({ data }: { data: CommentProps }) {
  const [isPending, startTransition] = useTransition();

  const executeDelete = async () => {
    const formData = new FormData();
    formData.append("id", data.id);

    startTransition(async () => {
      try {
        await deleteComment(formData);
        toast.success("Comment deleted");
      } catch (error) {
        console.error(error);
        toast.error("Unable to delete comment");
      }
    });
  };

  const authorName = `${data.author.firstName || "Unknown"} ${data.author.lastName || ""}`.trim();
  const created = new Date(data.createdAt);

  return (
    <article
      aria-busy={isPending}
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-4 rounded-md border border-[#5c3d21]/50 bg-[#18120e]/75 px-4 py-4 shadow-sm transition-colors hover:border-[#d4af37]/30 hover:bg-[#21170f]/90",
        isPending && "opacity-50"
      )}
    >
      <Avatar className="size-9 border border-[#3e2723]">
        <AvatarImage src={data.author.profileUrl || ""} alt="" />
        <AvatarFallback className="bg-[#3e2723] text-xs text-[#eaddcf]">
          {authorName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
          <span className="font-medium text-[#eaddcf]">{authorName}</span>
          <time
            dateTime={created.toISOString()}
            title={created.toLocaleString()}
            suppressHydrationWarning
            className="text-[#8d6e63]"
          >
            {formatDistanceToNow(created, { addSuffix: true })}
          </time>
        </p>

        <p className="mt-2 line-clamp-3 max-w-2xl wrap-break-word font-serif leading-7 text-[#eaddcf]/85">
          {data.description}
        </p>

        <Link
          href={`/discussions/${data.discussion.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex max-w-full items-center gap-1.5 text-sm text-[#a1887f] transition-colors hover:text-[#d4af37]"
        >
          <span className="shrink-0">On</span>
          <span className="truncate">{data.discussion.title}</span>
          <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </Link>
      </div>

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
                Delete this comment?
              </AlertDialogTitle>
              <AlertDialogDescription className="leading-relaxed text-[#a1887f]">
                It will be permanently removed from the discussion. This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <blockquote className="line-clamp-3 border-l border-[#3e2723] pl-4 font-serif leading-relaxed text-[#eaddcf]/80">
              {data.description}
            </blockquote>

            <AlertDialogFooter>
              <AlertDialogCancel className="border-[#3e2723] bg-transparent text-[#eaddcf] hover:bg-[#0f0b0a] hover:text-[#eaddcf]">
                Keep comment
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={executeDelete}
                className="bg-[#8f3b31] text-[#eaddcf] hover:bg-[#a6453a]"
              >
                Delete comment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </article>
  );
}
