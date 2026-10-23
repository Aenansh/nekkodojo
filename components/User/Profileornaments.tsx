import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CatSeal({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("size-8", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="42" height="42" rx="3" />
      {                   }
      <path d="M13 32V15l7 5h8l7-5v17c0 4.5-5 7-11 7s-11-2.5-11-7Z" />
      {          }
      <path d="M19 26v2.5M29 26v2.5" strokeWidth="2" />
      {          }
      <path d="M24 31.5v1.5" />
      {              }
      <path d="M7 28l6 1.2M7 32l6-1.2M41 28l-6 1.2M41 32l-6-1.2" strokeWidth="1" />
    </svg>
  );
}

export function EnsoRing({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
    >
      <circle
        cx="50"
        cy="50"
        r="48"
        strokeWidth="1.6"
        strokeDasharray="270 32"
        transform="rotate(-70 50 50)"
      />
      <circle
        cx="50"
        cy="50"
        r="46"
        strokeWidth="0.5"
        opacity="0.5"
        strokeDasharray="230 59"
        transform="rotate(-40 50 50)"
      />
    </svg>
  );
}

export function SectionHeading({
  id,
  title,
  kanji,
  aside,
}: {
  id?: string;
  title: string;
  kanji?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[#3e2723] pb-3">
      <h2 id={id} className="flex items-baseline gap-3 font-serif text-xl text-[#eaddcf]">
        {title}
        {kanji && (
          <span lang="ja" className="text-sm text-[#8d6e63]">
            {kanji}
          </span>
        )}
      </h2>
      {aside}
    </div>
  );
}
