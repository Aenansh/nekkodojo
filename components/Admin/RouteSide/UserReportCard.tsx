"use client";

import { useState } from "react";
import { Check, EyeOff, Gavel, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  dismissReport,
  banUser,
  unbanUser,
  shadowbanUser,
} from "@/app/(admin)/(protected)/_actions";
import { ActionButton, Case, ReasonQuote, Tag, statusLabel, statusTone } from "./ReportParts";

export function UserReportCard({ report }: UserReportProps) {
  const [loading, setLoading] = useState(false);

  const reporterName = report.reporter.firstName
    ? `${report.reporter.firstName} ${report.reporter.lastName || ""}`.trim()
    : "A member";

  const reportedName = report.reported.firstName
    ? `${report.reported.firstName} ${report.reported.lastName || ""}`.trim()
    : "Unknown member";

  const status = String((report as { status?: string }).status ?? "PENDING");
  const date = new Date(report.createdAt).toLocaleDateString();

  const handleAction = async (action: "dismiss" | "ban" | "unban" | "shadowban") => {
    setLoading(true);
    try {
      let res;

      switch (action) {
        case "dismiss":
          await dismissReport(report.id);
          toast.success("Report dismissed");
          break;
        case "ban":
          res = await banUser(report.reported.id, report.id);
          if (res?.success) toast.success(res.message);
          else toast.error(res?.message || "Action failed");
          break;
        case "unban":
          res = await unbanUser(report.reported.id);
          if (res?.success) toast.success(res.message);
          else toast.error(res?.message || "Action failed");
          break;
        case "shadowban":
          res = await shadowbanUser(report.reported.id, report.id, 7);
          if (res?.success) toast.success(res.message);
          else toast.error(res?.message || "Action failed");
          break;
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  /* ---- Closed cases: one quiet line ---- */
  if (status !== "PENDING") {
    return (
      <article className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[#3e2723]/60 px-2 py-4">
        <div className="flex min-w-0 items-baseline gap-4">
          <Tag tone={statusTone(status)}>{statusLabel(status)}</Tag>
          <span className="truncate text-[#a1887f]">
            {reportedName}: {report.reason}
          </span>
        </div>
        <span className="text-sm text-[#8d6e63]">Member report, {date}</span>
      </article>
    );
  }

  /* ---- Open case ---- */
  return (
    <Case
      busy={loading}
      actions={
        <>
          <ActionButton tone="clear" onClick={() => handleAction("dismiss")} disabled={loading}>
            <Check aria-hidden />
            Dismiss report
          </ActionButton>

          <ActionButton
            tone="shadow"
            onClick={() => handleAction("shadowban")}
            disabled={loading}
            title="Hide this member's posts from others for 7 days"
          >
            <EyeOff aria-hidden />
            Shadow ban, 7 days
          </ActionButton>

          {report.reported.isBanned ? (
            <ActionButton tone="clear" onClick={() => handleAction("unban")} disabled={loading}>
              <Unlock aria-hidden />
              Lift ban
            </ActionButton>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <ActionButton tone="ban" disabled={loading}>
                  <Gavel aria-hidden />
                  Ban permanently
                </ActionButton>
              </AlertDialogTrigger>

              <AlertDialogContent className="border-[#3e2723] bg-[#1a110d] text-[#eaddcf]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-serif text-xl text-[#eaddcf]">
                    Ban {reportedName} permanently?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="leading-relaxed text-[#a1887f]">
                    They will lose access to their account. You can lift the ban later from the
                    Banned tab.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-[#3e2723] bg-transparent text-[#eaddcf] hover:bg-[#0f0b0a] hover:text-[#eaddcf]">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleAction("ban")}
                    className="bg-[#8f3b31] text-[#eaddcf] hover:bg-[#a6453a]"
                  >
                    Ban permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </>
      }
    >
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <Tag tone="report">Member report</Tag>
        <p className="text-sm text-[#8d6e63]">
          Reported by <span className="text-[#a1887f]">{reporterName}</span>, {date}
        </p>
      </header>

      <div className="flex items-center gap-4">
        <Avatar className="size-11 border border-[#3e2723]">
          <AvatarImage src={report.reported.profileUrl || ""} alt="" />
          <AvatarFallback className="bg-[#3e2723] text-[#eaddcf]">
            {reportedName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-serif text-lg text-[#eaddcf]">{reportedName}</span>
            {report.reported.isBanned && <Tag tone="ban">Banned</Tag>}
            {report.reported.isShadowBanned && <Tag tone="shadow">Shadow banned</Tag>}
          </p>
          <p className="truncate text-sm text-[#8d6e63]">{report.reported.email}</p>
        </div>
      </div>

      <ReasonQuote>{report.reason}</ReasonQuote>
    </Case>
  );
}
