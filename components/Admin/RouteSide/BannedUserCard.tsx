"use client";

import { useState } from "react";
import { Unlock } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { unbanUser } from "@/app/(admin)/(protected)/_actions";
import { ActionButton, Tag } from "./ReportParts";

interface BannedUserProps {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileUrl: string | null;
    email: string;
    createdAt: Date;
  };
}

export function BannedUserCard({ user }: BannedUserProps) {
  const [loading, setLoading] = useState(false);

  const fullName = user.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : "Unknown member";

  const handleUnban = async () => {
    setLoading(true);
    try {
      const res = await unbanUser(user.id);
      if (res?.success) {
        toast.success(res.message);
      } else {
        toast.error(res?.message || "Unable to lift ban");
      }
    } catch (err) {
      console.error(err);
      toast.error("Unable to lift ban");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="grid items-center gap-x-8 gap-y-3 border-b border-l-2 border-b-[#3e2723]/60 border-l-[#8f3b31] px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex min-w-0 items-center gap-4">
        <Avatar className="size-11 border border-[#3e2723]">
          <AvatarImage src={user.profileUrl || ""} alt="" className="grayscale" />
          <AvatarFallback className="bg-[#3e2723] text-[#eaddcf]">
            {fullName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-serif text-lg text-[#eaddcf]">{fullName}</span>
            <Tag tone="ban">Banned</Tag>
          </p>
          <p className="truncate text-sm text-[#8d6e63]">{user.email}</p>
        </div>
      </div>

      <div className="sm:w-40">
        <ActionButton tone="clear" onClick={handleUnban} loading={loading}>
          {!loading && <Unlock aria-hidden />}
          Lift ban
        </ActionButton>
      </div>
    </article>
  );
}
