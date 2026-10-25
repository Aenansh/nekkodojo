import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const TONES = {
  report: {
    text: "text-[#d4af37]",
    border: "border-[#d4af37]/40",
    hover: "hover:bg-[#d4af37]/10",
    dot: "bg-[#d4af37]",
  },
  clear: {
    text: "text-[#8fb573]",
    border: "border-[#4f6b3f]",
    hover: "hover:bg-[#4f6b3f]/25",
    dot: "bg-[#7fa66b]",
  },
  shadow: {
    text: "text-[#a99bd6]",
    border: "border-[#5b4f8a]",
    hover: "hover:bg-[#5b4f8a]/25",
    dot: "bg-[#8a7fc4]",
  },
  ban: {
    text: "text-[#d4796b]",
    border: "border-[#8f3b31]",
    hover: "hover:bg-[#8f3b31]/25",
    dot: "bg-[#c4574a]",
  },
  quiet: {
    text: "text-[#a1887f]",
    border: "border-[#3e2723]",
    hover: "hover:bg-[#1a110d]",
    dot: "bg-[#8d6e63]",
  },
} as const;

export type Tone = keyof typeof TONES;

export function Tag({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", TONES[tone].text)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", TONES[tone].dot)} />
      {children}
    </span>
  );
}

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone: Tone;
  loading?: boolean;
};

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ tone, loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      className={cn(
        "flex w-full items-center justify-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#eaddcf] disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        TONES[tone].text,
        TONES[tone].border,
        TONES[tone].hover,
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  )
);
ActionButton.displayName = "ActionButton";

export function Case({
  children,
  actions,
  busy,
}: {
  children: ReactNode;
  actions: ReactNode;
  busy?: boolean;
}) {
  return (
    <article
      aria-busy={busy}
      className={cn(
        "grid gap-x-10 gap-y-5 border-b border-[#3e2723]/60 px-2 py-6 transition-opacity md:grid-cols-[minmax(0,1fr)_14rem]",
        busy && "opacity-60"
      )}
    >
      <div className="min-w-0 space-y-5">{children}</div>
      <div className="flex flex-col gap-2 md:pt-1">
        <p className="text-xs text-[#8d6e63]">Decision</p>
        {actions}
      </div>
    </article>
  );
}

export function ReasonQuote({ children }: { children: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-[#8d6e63]">Reason given</p>
      <blockquote className="mt-1.5 border-l-2 border-[#d4af37]/60 pl-4 font-serif leading-relaxed text-[#eaddcf]/90">
        {children}
      </blockquote>
    </div>
  );
}

export function statusTone(status: string): Tone {
  if (/dismiss/i.test(status)) return "clear";
  if (/ban|remov|delet|action/i.test(status)) return "ban";
  return "quiet";
}

export function statusLabel(status: string) {
  const text = status.toLowerCase().replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
