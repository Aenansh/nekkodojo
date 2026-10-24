"use client";

import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, Trash2, ArrowUpRight } from "lucide-react";
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
import { dismissReport, deleteDiscussion, deleteComment } from "@/app/(admin)/(protected)/_actions";
import { toast } from "sonner";
import Link from "next/link";
import { ActionButton, Case, ReasonQuote, Tag, statusLabel, statusTone } from "./ReportParts";

export function ReportCard({ report }: { report: ReportProps }) {
  const [isPending, startTransition] = useTransition();

  const isDiscussion = !!report.discussion;
  const contentId = isDiscussion ? report.discussion?.id : report.comment?.id;
  const kind = isDiscussion ? "discussion" : "comment";

  const reporterName = report.reporter.firstName || "A member";
  const when = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true });

  const handleDismiss = () => {
    startTransition(async () => {
      try {
        await dismissReport(report.id);
        toast.success("Report dismissed");
      } catch (error) {
        console.error(error);
        toast.error("Unable to dismiss report");
      }
    });
  };

  const executeDelete = () => {
    if (!contentId) return;

    const formData = new FormData();
    formData.append("id", contentId);

    startTransition(async () => {
      try {
        if (isDiscussion) {
          await deleteDiscussion(formData);
        } else {
          await deleteComment(formData);
        }
        toast.success(`${isDiscussion ? "Discussion" : "Comment"} removed`);
      } catch (error) {
        console.error(error);
        toast.error(`Unable to remove ${kind}`);
      }
    });
  };

  /* ---- Closed cases: one quiet line ---- */
  if (report.status !== "PENDING") {
    return (
      <article className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[#3e2723]/60 px-2 py-4">
        <div className="flex min-w-0 items-baseline gap-4">
          <Tag tone={statusTone(report.status)}>{statusLabel(report.status)}</Tag>
          <span className="truncate text-[#a1887f]">{report.reason}</span>
        </div>
        <span className="text-sm text-[#8d6e63]" suppressHydrationWarning>
          {kind === "discussion" ? "Discussion" : "Comment"}, {when}
        </span>
      </article>
    );
  }

  /* ---- Open case ---- */
  return (
    <Case
      busy={isPending}
      actions={
        <>
          <ActionButton
            tone="clear"
            onClick={handleDismiss}
            loading={isPending}
            disabled={isPending}
          >
            {!isPending && <Check aria-hidden />}
            Dismiss report
          </ActionButton>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <ActionButton tone="ban" disabled={isPending || !contentId}>
                <Trash2 aria-hidden />
                Delete {kind}
              </ActionButton>
            </AlertDialogTrigger>

            <AlertDialogContent className="border-[#3e2723] bg-[#1a110d] text-[#eaddcf]">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-serif text-xl text-[#eaddcf]">
                  Delete this {kind}?
                </AlertDialogTitle>
                <AlertDialogDescription className="leading-relaxed text-[#a1887f]">
                  It will be permanently removed. This can&apos;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-[#3e2723] bg-transparent text-[#eaddcf] hover:bg-[#0f0b0a] hover:text-[#eaddcf]">
                  Keep {kind}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={executeDelete}
                  className="bg-[#8f3b31] text-[#eaddcf] hover:bg-[#a6453a]"
                >
                  Delete {kind}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      }
    >
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <Tag tone="report">{isDiscussion ? "Discussion report" : "Comment report"}</Tag>
        <p className="text-sm text-[#8d6e63]" suppressHydrationWarning>
          Reported by <span className="text-[#a1887f]">{reporterName}</span>, {when}
        </p>
      </header>

      <div>
        <p className="text-xs text-[#8d6e63]">Reported {kind}</p>
        {isDiscussion ? (
          report.discussion ? (
            <Link
              href={`/discussions/${report.discussion.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex max-w-full items-center gap-2 font-serif text-lg text-[#eaddcf] transition-colors hover:text-[#d4af37]"
            >
              <span className="truncate">{report.discussion.title}</span>
              <ArrowUpRight className="size-4 shrink-0" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </Link>
          ) : (
            <p className="mt-1.5 text-sm text-[#8d6e63]">
              This discussion has already been deleted.
            </p>
          )
        ) : report.comment ? (
          <>
            <p className="mt-1.5 line-clamp-3 font-serif leading-relaxed text-[#eaddcf]/80">
              {report.comment.description}
            </p>
            <Link
              href={`/discussions/${report.comment.discussionId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#a1887f] transition-colors hover:text-[#d4af37]"
            >
              View in context
              <ArrowUpRight className="size-3.5" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </Link>
          </>
        ) : (
          <p className="mt-1.5 text-sm text-[#8d6e63]">This comment has already been deleted.</p>
        )}
      </div>

      <ReasonQuote>{report.reason}</ReasonQuote>
    </Case>
  );
}
