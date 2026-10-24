"use client";

import { useOptimistic, useTransition } from "react";
import Image from "next/image";
import { removeRole, setRole } from "@/app/(admin)/(protected)/_actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UserProps {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  email: string | undefined;
  initialRole: string;
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  moderator: "Moderator",
  user: "Member",
};

export function UserRoleCard({ user }: { user: UserProps }) {
  const [optimisticRole, setOptimisticRole] = useOptimistic(
    user.initialRole,
    (state, newRole: string) => newRole
  );

  const [isPending, startTransition] = useTransition();

  const handleSetRole = async (formData: FormData) => {
    const newRole = formData.get("role") as string;

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

  const handleRemoveRole = async (formData: FormData) => {
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

  const displayName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Unnamed member";

  return (
    <div className="grid items-center gap-x-6 gap-y-4 border-b border-[#3e2723]/60 px-2 py-4 transition-colors hover:bg-[#1a110d]/60 md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex min-w-0 items-center gap-4">
        <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-[#3e2723] bg-[#1a110d]">
          <Image src={user.imageUrl} alt="" fill sizes="44px" className="object-cover" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-[#eaddcf]">{displayName}</p>
          <p className="truncate text-sm text-[#8d6e63]">{user.email}</p>
        </div>
      </div>

      <div
        role="group"
        aria-label={`Role for ${displayName}`}
        className="flex w-fit overflow-hidden rounded-md border border-[#3e2723]"
      >
        <RoleForm
          action={handleSetRole}
          userId={user.id}
          role="admin"
          label="Admin"
          current={optimisticRole === "admin"}
          disabled={isPending}
        />
        <RoleForm
          action={handleSetRole}
          userId={user.id}
          role="moderator"
          label="Moderator"
          current={optimisticRole === "moderator"}
          disabled={isPending}
          divider
        />
        <RoleForm
          action={handleRemoveRole}
          userId={user.id}
          label="Member"
          current={optimisticRole === "user"}
          disabled={isPending}
          divider
        />
      </div>

      <span className="sr-only">Current role: {ROLE_LABEL[optimisticRole] ?? optimisticRole}</span>
    </div>
  );
}

function RoleForm({
  action,
  userId,
  role,
  label,
  current,
  disabled,
  divider,
}: {
  action: (formData: FormData) => void | Promise<void>;
  userId: string;
  role?: string;
  label: string;
  current: boolean;
  disabled: boolean;
  divider?: boolean;
}) {
  return (
    <form action={action} className={cn(divider && "border-l border-[#3e2723]")}>
      <input type="hidden" name="id" value={userId} />
      {role && <input type="hidden" name="role" value={role} />}
      <button
        type="submit"
        aria-pressed={current}
        disabled={current || disabled}
        className={cn(
          "px-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#eaddcf]",
          current
            ? "bg-[#d4af37] font-medium text-[#0f0b0a]"
            : "text-[#a1887f] hover:bg-[#1a110d] hover:text-[#eaddcf] disabled:opacity-50"
        )}
      >
        {label}
      </button>
    </form>
  );
}
