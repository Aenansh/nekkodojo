import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-[#0f0b0a]">
      <div className="flex items-center gap-3 text-[#d4af37]" role="status" aria-live="polite">
        <Loader2 className="size-6 animate-spin" aria-hidden="true" />
        <span className="font-mono text-sm tracking-wide">Loading...</span>
      </div>
    </div>
  );
}