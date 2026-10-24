"use client";

import { useOptimistic, useTransition } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { removeRole, setRole } from "@/app/(admin)/(protected)/_actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type AdminUserRow = {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  beltRank: string | null;
  profileUrl: string | null;
  createdAt: Date;
  role: string;
};

export function AdminUserCard({ user }: { user: AdminUserRow }) {
  const [optimisticRole, setOptimisticRole] = useOptimistic(
    user.role,
    (state, newRole: string) => newRole
  );
  const [isPending, startTransition] = useTransition();

  const handleSetRole = async (newRole: string) => {
    const formData = new FormData();
    formData.append("id", user.id);
    formData.append("role", newRole);

    startTransition(async () => {
      setOptimisticRole(newRole);
      try {
        await setRole(formData);
        toast.success(`Role updated to ${newRole}`);
      } catch (error) {
        console.error(error);
        toast.error("Unable to update role");
      }
    });
  };

  const handleRemoveRole = async () => {
    const formData = new FormData();
    formData.append("id", user.id);

    startTransition(async () => {
      setOptimisticRole("user");
      try {
        await removeRole(formData);
        toast.success("Role removed");
      } catch (error) {
        console.error(error);
        toast.error("Unable to remove role");
      }
    });
  };

  const person = user.firstName || user.name || "this member";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          className="h-8 gap-1.5 rounded-full border border-[#3e2723] px-3 text-sm text-[#a1887f] hover:border-[#d4af37] hover:bg-transparent hover:text-[#d4af37] focus-visible:ring-1 focus-visible:ring-[#d4af37]"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <>
              Role
              <ChevronDown className="size-3.5" aria-hidden />
            </>
          )}
          <span className="sr-only">Change role for {person}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="z-50 w-64 border-[#3e2723] bg-[#1a110d] text-[#eaddcf] shadow-xl"
      >
        <DropdownMenuLabel className="text-sm font-normal text-[#a1887f]">
          Role for {person}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#3e2723]" />

        <RoleItem
          title="Admin"
          description="Full access to every admin tool."
          current={optimisticRole === "admin"}
          disabled={isPending}
          onSelect={() => handleSetRole("admin")}
        />
        <RoleItem
          title="Moderator"
          description="Can review content, comments and reports."
          current={optimisticRole === "moderator"}
          disabled={isPending}
          onSelect={() => handleSetRole("moderator")}
        />

        {optimisticRole !== "user" && (
          <>
            <DropdownMenuSeparator className="bg-[#3e2723]" />
            <RoleItem
              title="Remove role"
              description="Return to a regular member."
              danger
              disabled={isPending}
              onSelect={handleRemoveRole}
            />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RoleItem({
  title,
  description,
  current,
  danger,
  disabled,
  onSelect,
}: {
  title: string;
  description: string;
  current?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      disabled={disabled || current}
      onSelect={onSelect}
      className={cn(
        "my-0.5 cursor-pointer items-start gap-3 py-2.5 data-disabled:opacity-100",
        danger
          ? "text-[#d4796b] focus:bg-[#8f3b31]/20 focus:text-[#d4796b]"
          : "focus:bg-[#3e2723]/40 focus:text-[#d4af37]"
      )}
    >
      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
        {current && <Check className="size-4 text-[#d4af37]" aria-hidden />}
      </span>
      <span className="flex flex-col">
        <span className={cn(current && "text-[#d4af37]")}>
          {title}
          {current && <span className="ml-2 text-xs text-[#8d6e63]">Current</span>}
        </span>
        <span className={cn("text-xs", danger ? "opacity-80" : "text-[#8d6e63]")}>
          {description}
        </span>
      </span>
    </DropdownMenuItem>
  );
}
